import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import Groups from '@models/Groups';
import Users from '@models/Users';
import Users_Groups from '@models/Users_Groups';
import Modules from '@models/Modules';
import { Op } from 'sequelize';

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        usernames: string[],
        groupName: string (new lectureCode)
    }
}
Returns the groupId of the group given the users and group name.
    NOTE: MAY NOT BE ACCURATE
**/
async function getGroupId(req: Request, res: Response) {
    const { usernames, groupName } = req.body;
    await Groups.findOne({
        where: {
            name: groupName
        },
        include: [
            {
                model: Users,
                where: {
                    username: usernames
                }
            }
        ]
    })
        .then((group) => {
            return res.status(200).json({ groupId: group?.id });
        })
        .catch((error: AxiosError) => {
            return res
                .status(500)
                .json({ message: 'Group not found!', error: error });
        });
}

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        groupName: number (new lectureCode),
        username: string[]
    }
}
Create a new group with the list of users, return groupId
**/
async function getGroups(req: Request, res: Response) {
    const username = req.query.username as string;
    await Users.findByPk(username, {
        include: [
            {
                model: Groups
            }
        ]
    })
        .then(async (user) => {
            const groups = await user?.getGroups();
            return res.status(200).json({
                groups: groups?.map((group) => group.toJSON())
            });
        })
        .catch(() => {
            return res
                .status(404)
                .json({ message: 'user could not be found!' });
        });
}

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        groupName: number (new lectureCode),
        username: string[]
    }
}
Create a new group with the list of users, return groupId
**/
async function getUsersInGroup(req: Request, res: Response) {
    const groupId = req.query.groupId as string;
    await Groups.findByPk(groupId, {
        include: [
            {
                model: Users
            }
        ]
    })
        .then(async (group) => {
            const users = await group?.getUsers();
            return res.status(200).json({
                users: users?.map((user) => user.toJSON())
            });
        })
        .catch(() => {
            res.status(404).json({ message: 'user could not be found!' });
        });
}

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        groupName: number (new lectureCode),
        username: string[]
    }
}
Checks if module code exists and is correct, if not in correct format -> Corrects it!
Create a new group with the list of users, return groupId
**/
async function createGroup(req: Request, res: Response) {
    const { groupName, moduleCode, color, username, ay, sem } = req.body;
    const actAy = parseInt(ay);
    const actSem = parseInt(sem);
    await Modules.findOne({
        where: {
            code: {
                [Op.iLike]: `${moduleCode}`
            }
        }
    })
        .then(async (module) => {
            const moduleCode = module?.code as string;
            const group = await Groups.create({
                name: groupName,
                moduleCode: moduleCode,
                color: color,
                ay: actAy,
                sem: actSem
            });
            const user = await Users.findByPk(username, {
                include: [
                    {
                        model: Groups
                    }
                ]
            });
            await group.addUser(user as Users);

            return res.status(200).json({
                id: group.id,
                moduleCode: moduleCode,
                name: groupName,
                color: color
            });
        })
        .catch(() => {
            return res.status(404).json({ message: 'Module does not exist!' });
        });
}

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        groupId: number
    }
}
Create a new group with the list of users, return groupId
**/
async function deleteGroup(req: Request, res: Response) {
    const { groupId } = req.body;
    await Groups.destroy({
        where: {
            id: groupId
        }
    });
    await Users_Groups.destroy({
        where: {
            groupId: groupId
        }
    })
        .then(() => {
            res.status(200).json({ message: 'Group successfully deleted' });
        })
        .catch((err) => {
            res.status(401).json({ message: err });
        });
}

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        username: string,
        groupId: number (new lectureCode)
    }
}
Modifies the lessons being taken by the user for particular module in the database and returns the number of values updated
    **/
async function addUserToGroup(req: Request, res: Response) {
    const { username, groupId } = req.body;
    return await Groups.findByPk(groupId, {
        include: [
            {
                model: Users
            }
        ]
    })
        .then(async (group) => {
            const user = await Users.findByPk(username);
            await group?.addUser(user as Users);
            return res.status(200).json({ message: 'User added to group!' });
        })
        .catch(() => {
            return res.status(404).json({ message: 'Group not found!' });
        });
}

/** 
    req: {
    headers: {
        Authorization: ~token~
    },
    body: {
        username: string,
        groupId: number (new lectureCode)
    }
}
Modifies the lessons being taken by the user for particular module in the database and returns the number of values updated
    **/
async function removeUserFromGroup(req: Request, res: Response) {
    const username = req.query.username as string;
    const groupId = parseInt(req.query.groupId as string);
    return await Groups.findByPk(groupId, {
        include: [
            {
                model: Users
            }
        ]
    })
        .then(async (group) => {
            if (
                await group?.countUsers().then((userCount) => userCount === 1)
            ) {
                await Groups.destroy({
                    where: {
                        id: groupId
                    }
                });
                await Users_Groups.destroy({
                    where: {
                        groupId: groupId
                    }
                });
                return res.status(200).json({ message: 'Removed User!' });
            }

            const user = await Users.findByPk(username);
            await group?.removeUser(user as Users);
            return res.status(200).json({ message: 'Removed User!' });
        })
        .catch(() => {
            return res.status(404).json({ message: 'Cannot find group!' });
        });
}

export default {
    getGroupId,
    getGroups,
    getUsersInGroup,
    createGroup,
    deleteGroup,
    addUserToGroup,
    removeUserFromGroup
};
