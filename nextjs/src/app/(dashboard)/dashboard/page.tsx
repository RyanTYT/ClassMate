'use client';
import React from 'react';
import { toast } from 'react-hot-toast';
import '@app/(dashboard)/globals.css';
import styles from '@app/(dashboard)/dashboard/dashboard.module.css';
import GroupBox from '@components/dashboard/dashboard/GroupBox';
import UserSearchBar from '@components/dashboard/dashboard/UserSearchBar';
import PeopleBar from '@components/PeopleBar';
import AddProjectButton from '@components/dashboard/dashboard/AddProjectButton';
import GroupForm from '@components/dashboard/dashboard/GroupForm';
import { Dispatch, useEffect, useLayoutEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import config from '@/config';
const { expressHost } = config;

import group, { groupWithUsersNoEmail } from '@models/group';
import { userWithoutEmail } from '@models/user';

// Rendering of all the GroupBoxes
const GroupBoxes = ({
    groups,
    waiting,
    setWaiting,
    setGroupChosen,
    setUserChosen,
    groupsUpdated,
    setGroupsUpdated
}: {
    groups: groupWithUsersNoEmail[];
    waiting: boolean;
    setWaiting: Dispatch<boolean>;
    setGroupChosen: Dispatch<group>;
    setUserChosen: Dispatch<userWithoutEmail | undefined>;
    groupsUpdated: boolean;
    setGroupsUpdated: Dispatch<boolean>;
}) => {
    return (
        <>
            {groups.map((oneGroup: groupWithUsersNoEmail) => {
                return (
                    <GroupBox
                        waiting={waiting}
                        setWaiting={setWaiting}
                        backgroundColor={oneGroup.color}
                        id={oneGroup.id}
                        header={oneGroup.moduleCode}
                        subheader={oneGroup.name}
                        users={oneGroup.users}
                        width="50%"
                        setGroupChosen={setGroupChosen}
                        setGroupsUpdated={() =>
                            setGroupsUpdated(!groupsUpdated)
                        }
                        setUserChosen={setUserChosen}
                        key={oneGroup.id}
                    />
                );
            })}
        </>
    );
};

// Rendering of all the users
const FoundUsers = ({
    searchRes,
    setUserChosen,
    setWaiting,
    groupChosen
}: {
    searchRes: userWithoutEmail[];
    setUserChosen: Dispatch<userWithoutEmail>;
    setWaiting: Dispatch<boolean>;
    groupChosen: group | undefined;
}) => {
    return (
        <>
            {searchRes.map((user) => {
                return (
                    <PeopleBar
                        user={user}
                        bio=""
                        setUserChosen={(user: userWithoutEmail) => {
                            setUserChosen(user);
                            if (!groupChosen) {
                                setWaiting(true);
                            }
                        }}
                        key={user.username}
                    />
                );
            })}
        </>
    );
};

export default function Dashboard() {
    // // Determining date for section
    // const currentDate = new Date();
    // const month = currentDate.toLocaleString('default', { month: 'long' });
    // const day = currentDate.getDate();
    // const formattedDate = `${month}, ${day}`;

    // setNewGroup will be set by groupForm when form is submitted => Then re-rendering of group boxes
    // setGroups will be set by the rendering of the groupBoxes
    // setSearchRes will be set by the UserSearchBar
    // setFormVisible will be set by groupForm to be toggled to false and set by AddProjectButton to be toggled to true
    // setGroupChosen will be set by the add user button in the group box => then modify the heading and PeopleBar for the messages section
    const [newGroup, setNewGroup] = useState<group>();
    const [groups, setGroups] = useState<groupWithUsersNoEmail[]>([]);
    const [searchRes, setSearchRes] = useState<userWithoutEmail[]>([]);
    const [formVisible, setFormVisible] = useState(false);
    const [groupChosen, setGroupChosen] = useState<group>();
    const [userChosen, setUserChosen] = useState<userWithoutEmail>();
    const [groupsUpdated, setGroupsUpdated] = useState<boolean>(false);
    const [waiting, setWaiting] = useState<boolean>(false);

    // Functionality for addProjectButton
    const addGroup = () => {
        setFormVisible(true);
    };

    // Dynamically rendered messages header
    const MessagesHeader = () => {
        if (groupChosen) {
            return <p>{`Add user to ${groupChosen.name}:`}</p>;
        }
        return <p>Find others!</p>;
    };

    // Search Bar Functionalities
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            setGroupChosen(undefined);
        }
    };

    useLayoutEffect(() => {
        // Set all groups
        const getUsersInGroups = async (groups: group[]) => {
            return await Promise.all(
                groups.map(async (group) => {
                    return await axios
                        .get(`${expressHost}/authorized/group`, {
                            headers: {
                                Authorization: sessionStorage.getItem('token')
                            },
                            params: {
                                groupId: group.id
                            }
                        })
                        .then((res: AxiosResponse) => {
                            return {
                                id: group.id,
                                moduleCode: group.moduleCode,
                                name: group.name,
                                color: group.color,
                                users: res.data.users as userWithoutEmail[]
                            } as groupWithUsersNoEmail;
                        })
                        .catch((err) =>
                            toast.error(
                                `Error when fetching users for group: ${err}`
                            )
                        );
                })
            );
        };
        const getGroups = async () => {
            return await axios
                .get(`${expressHost}/authorized/group/user`, {
                    headers: {
                        Authorization: sessionStorage.getItem('token')
                    },
                    params: {
                        username: sessionStorage.getItem('username'),
                        ay: sessionStorage.getItem('ay'),
                        semester: sessionStorage.getItem('sem')
                    }
                })
                .then(async (res: AxiosResponse) => {
                    const groups: group[] = res.data.groups;
                    const groupsWithUsers = await getUsersInGroups(groups);
                    setGroups(groupsWithUsers as groupWithUsersNoEmail[]);
                })
                .catch((err) =>
                    toast.error(`Error when finding groups associated: ${err}`)
                );
        };

        getGroups();
    }, [newGroup, groupsUpdated]);

    useEffect(() => {
        if (userChosen && groupChosen) {
            // if userChosen is already in the groupChosen, then don't do anything
            if (
                (groups
                    .find((group) => group.id === groupChosen.id)
                    ?.users.filter(
                        (user) => user.username === userChosen.username
                    )?.length as number) === 0
            ) {
                toast.promise(
                    axios
                        .post(
                            `${expressHost}/authorized/notifications`,
                            {
                                username: sessionStorage.getItem('username'),
                                groupId: groupChosen.id,
                                requestee: userChosen.username
                            },
                            {
                                headers: {
                                    Authorization:
                                        sessionStorage.getItem('token')
                                }
                            }
                        )
                        .then(() => {
                            setNewGroup(groupChosen);
                        })
                        .catch(() => console.log('Error in sending request!')),
                    {
                        loading: 'Sending request...', // Message displayed while the promise is pending
                        success: () => `Success: Request sent!`, // Message displayed when the promise resolves
                        error: 'Request was intercepted by the request boogeyman! Please try again!' // Message displayed when the promise rejects
                    }
                );
                setUserChosen(undefined);
            }
        }
    }, [groups, userChosen?.username, groupChosen?.id]);

    // Formatted Date if you ever want it again!
    // <p className={styles['time']}>{formattedDate.toString()}</p>
    return (
        <>
            <div className={styles['projects-section']}>
                <div className={styles['projects-section-header']}>
                    <p>Groups</p>
                    <AddProjectButton clickHandler={addGroup} />
                </div>
                <div className={styles['project-boxes']}>
                    <GroupBoxes
                        groups={groups}
                        waiting={waiting}
                        setWaiting={setWaiting}
                        setGroupChosen={setGroupChosen}
                        setUserChosen={setUserChosen}
                        groupsUpdated={groupsUpdated}
                        setGroupsUpdated={setGroupsUpdated}
                    />
                </div>
            </div>
            <div className={styles['messages-section']}>
                <div className={styles['projects-section-header']}>
                    <MessagesHeader />
                    <UserSearchBar
                        focused={groupChosen ? true : false}
                        handleKeyDown={handleKeyDown}
                        setSearchRes={setSearchRes}
                        width="80%"
                    />
                </div>
                <div className={styles['messages']}>
                    <FoundUsers
                        searchRes={searchRes}
                        setWaiting={setWaiting}
                        setUserChosen={setUserChosen}
                        groupChosen={groupChosen}
                    />
                </div>
            </div>
            <GroupForm
                visibility={formVisible}
                setVisibility={setFormVisible}
                setNewGroup={setNewGroup}
            />
        </>
    );
}
