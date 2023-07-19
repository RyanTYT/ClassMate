'use client';
import React, { Dispatch, useEffect } from 'react';
import styles from '@components/dashboard/timetable/timetable.module.css';
import colors from '@models/colors';

import { moduleWithLessonsFixedChosen } from '@models/module';
import overlapCounter from '@components/dashboard/timetable/overlapCounter';
import axios, { AxiosResponse } from 'axios';
import config from '@/config';
import { lessonChosen, lessonFixedChosen } from '@models/lesson';
const { expressHost } = config;

const readableWeeks = (weeks: number[]) => {
    const readableStr: string[] = [];

    for (let week of weeks) {
        if (readableStr.length === 0) {
            readableStr.push(week.toString());
            continue;
        }
        if (weeks.find((no) => no === week - 1) !== undefined) {
            const lastStr = readableStr.pop() || '0';
            readableStr.push(`${lastStr[0]}-${week}`);
            continue;
        }
        readableStr.push(week.toString());
    }
    return readableStr.join();
};

function Timetable({
    activities,
    setMods,
    setOverflowY
}: {
    activities: moduleWithLessonsFixedChosen[];
    setMods: Dispatch<moduleWithLessonsFixedChosen[]>;
    setOverflowY: Dispatch<boolean>;
}) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    // Components for the module tabs
    const toMin = (hours: number, minutes: number, time = ''): number => {
        if (time === null || time.length === 0) {
            return hours * 60 + minutes;
        }
        // change time format (10,45) to minutes (645)
        else {
            // "0710"
            const h = parseInt(time.slice(0, 2));
            const m = parseInt(time.slice(2, 4));

            return toMin(h, m);
        }
    };

    const minToPerc = (min: number): number => {
        return (min / (120 * 7)) * 100;
    };

    const actClickHandlerChosen = async (
        ay: number,
        semester: number,
        username: string,
        moduleCode: string,
        lessonType: string,
        haveOthersChosen: boolean,
        activities: moduleWithLessonsFixedChosen[],
        setMods: Dispatch<moduleWithLessonsFixedChosen[]>
    ) => {
        const activitiesChosen = activities.map((activity) => {
            return {
                code: activity.code,
                name: activity.name,
                lessons: activity.lessons.filter((less) => less.chosen)
            };
        });
        if (haveOthersChosen) {
            return setMods(activitiesChosen);
        }
        const possibleLessons = await axios
            .get(`${expressHost}/authorized/module/lessons`, {
                headers: {
                    Authorization: sessionStorage.getItem('token')
                },
                params: {
                    ay: ay,
                    semester: semester,
                    username: username,
                    moduleCode: moduleCode,
                    lessonType: lessonType
                }
            })
            .then((res: AxiosResponse) => {
                const lesses = res.data.lessons as lessonChosen[];
                return lesses.map((less) => {
                    return {
                        ...less,
                        fixed: false
                    } as lessonFixedChosen;
                });
            });
        return setMods(
            activitiesChosen.map((activity) => {
                if (activity.code === moduleCode) {
                    const currLessWithoutLessonType = activity.lessons.filter(
                        (less) => less.lessonType !== lessonType
                    );
                    currLessWithoutLessonType.push(...possibleLessons);
                    return {
                        code: activity.code,
                        name: activity.name,
                        lessons: currLessWithoutLessonType
                    };
                }
                return activity;
            })
        );
    };

    /** NOTE: ay and sem is implied by the function being limited by the activities variable already
     * */
    const actClickHandlerUnchosen = async (
        lessonId: string,
        lessonType: string,
        moduleCode: string,
        activities: moduleWithLessonsFixedChosen[],
        setMods: Dispatch<moduleWithLessonsFixedChosen[]>
    ) => {
        const lessonIds = activities.flatMap((mod) =>
            mod.lessons
                .filter(
                    (less) =>
                        less.moduleCode === moduleCode &&
                        less.lessonType === lessonType &&
                        less.lessonId === lessonId
                )
                .map((less) => less.id)
        );
        await axios
            .put(
                `${expressHost}/authorized/lessons`,
                {
                    username: sessionStorage.getItem('username'),
                    lessonIds: lessonIds
                },
                {
                    headers: {
                        Authorization: sessionStorage.getItem('token')
                    }
                }
            )
            .then(() => {
                setMods(
                    activities.map((mod) => {
                        if (mod.code !== moduleCode) {
                            return mod;
                        }

                        const chosenLessons = mod.lessons
                            .filter(
                                (less) =>
                                    less.lessonType === lessonType &&
                                    less.lessonId === lessonId
                            )
                            .map((less) => {
                                return {
                                    id: less.id,
                                    lessonId: less.lessonId,
                                    moduleCode: less.moduleCode,
                                    lessonType: less.lessonType,
                                    sem: less.sem,
                                    weeks: less.weeks,
                                    venue: less.venue,
                                    day: less.day,
                                    startTime: less.startTime,
                                    endTime: less.endTime,
                                    size: less.size,
                                    fixed: less.fixed,
                                    chosen: true
                                } as lessonFixedChosen;
                            });
                        const lessonsRemoveLessonType = mod.lessons.filter(
                            (less) => less.lessonType !== lessonType
                        );
                        lessonsRemoveLessonType.push(...chosenLessons);
                        return {
                            code: mod.code,
                            name: mod.name,
                            lessons: lessonsRemoveLessonType
                        };
                    })
                );
            });
    };

    // One Activitiy Tab
    const Activity = ({
        top = 0,
        height = 100,
        code = 'BT1101',
        startTime = '0800',
        endTime = '2200',
        color = 'blue',
        lessonType = 'Tutorial[C1]',
        lessonId = '1',
        venue = 'LOL',
        weeks = [],
        fixed,
        chosen,
        haveOthersChosen
    }: {
        top: number;
        height: number;
        code: string;
        startTime: string;
        endTime: string;
        color: string;
        lessonType: string;
        lessonId: string;
        venue: string;
        weeks: number[];
        fixed: boolean;
        chosen: boolean;
        haveOthersChosen: boolean;
    }) => {
        const start = minToPerc(toMin(0, 0, startTime) - toMin(8, 0));
        const width = minToPerc(toMin(0, 0, endTime) - toMin(0, 0, startTime));
        return (
            <div
                className={`${styles['s-act-tab']} ${haveOthersChosen && chosen ? styles['s-act-tab-chosen'] : ''
                    }`}
                style={{
                    top: `${top}%`,
                    left: `${start}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    opacity: `${chosen ? 0.8 : 0.5}`
                }}
            >
                {fixed ? (
                    <></>
                ) : (
                    <button
                        className={styles['act-btn']}
                        onClick={() =>
                            chosen
                                ? actClickHandlerChosen(
                                    parseInt(
                                        sessionStorage.getItem('ay') as string
                                    ),
                                    parseInt(
                                        sessionStorage.getItem(
                                            'sem'
                                        ) as string
                                    ),
                                    sessionStorage.getItem(
                                        'username'
                                    ) as string,
                                    code,
                                    lessonType,
                                    haveOthersChosen,
                                    activities,
                                    setMods
                                )
                                : actClickHandlerUnchosen(
                                    lessonId,
                                    lessonType,
                                    code,
                                    activities,
                                    setMods
                                )
                        }
                    />
                )}
                <div
                    className={`${color} ${styles['s-act-tab-background']}`}
                    style={{
                        borderRadius: `${fixed ? 5 : 16}px`
                    }}
                />
                <div className={styles['s-act-name']}>{code}</div>
                <div
                    className={styles['s-act-lesson']}
                >{`${lessonType} [${lessonId}]`}</div>
                <div className={styles['s-act-lesson']}>{venue}</div>
                <div className={styles['s-act-lesson']}>
                    {`Weeks ${readableWeeks(weeks)}`}
                </div>
            </div>
        );
    };

    const activitiesWithColors = activities.map(
        (mod: moduleWithLessonsFixedChosen, index: number) => {
            return {
                ...mod,
                color: colors[index % 12]
            };
        }
    );
    const orderedActivities = overlapCounter(activitiesWithColors);
    const totalOverlaps = orderedActivities.reduce(
        (firstNo, secNo) => firstNo + secNo.overlaps,
        0
    );
    useEffect(() => {
        setOverflowY(totalOverlaps > 6);
    }, [totalOverlaps]);
    // Activities for the whole week
    const Activities = () => {
        return (
            <>
                {orderedActivities.map((overlapNActivities, index: number) => {
                    const height =
                        (100 / totalOverlaps) * overlapNActivities.overlaps;
                    return (
                        <div
                            className={styles['s-act-row']}
                            style={{
                                height: `${height}%`
                            }}
                            key={`day-${index}`}
                        >
                            {overlapNActivities.lessons.map((less) => {
                                const haveOthersChosen =
                                    !overlapNActivities.lessons
                                        .filter(
                                            (specificLess) =>
                                                less.lessonType ===
                                                specificLess.lessonType &&
                                                less.moduleCode ===
                                                specificLess.moduleCode
                                        )
                                        .map(
                                            (specificLess) =>
                                                specificLess.chosen
                                        )
                                        .reduce(
                                            (chosen, specificLess) =>
                                                chosen && specificLess
                                        );
                                return (
                                    <Activity
                                        top={
                                            (100 /
                                                overlapNActivities.overlaps) *
                                            (less.order - 1)
                                        }
                                        height={
                                            100 / overlapNActivities.overlaps
                                        }
                                        key={`${less.id}_${less.startTime}`}
                                        code={less.moduleCode}
                                        color={less.color}
                                        startTime={less.startTime}
                                        endTime={less.endTime}
                                        lessonType={less.lessonType}
                                        lessonId={less.lessonId}
                                        venue={less.venue}
                                        weeks={less.weeks}
                                        fixed={less.fixed}
                                        chosen={less.chosen}
                                        haveOthersChosen={haveOthersChosen}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </>
        );
    };

    // Component for the background
    const Col = ({ gray = false }: { gray: boolean }) => {
        return (
            <div
                className={`${styles['s-hour-row']} ${gray ? styles['gray-col'] : ''
                    }`}
            >
                {orderedActivities.map((overlapNActivities, index: number) => {
                    const height =
                        (100 / totalOverlaps) * overlapNActivities.overlaps;
                    return (
                        <div
                            className={`${styles['s-hour-wrapper']}`}
                            style={{
                                height: `${height}%`
                            }}
                            key={`background-${index}`}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles['DM_Sans']}>
            <div className={styles['header']}>
                <div className={styles['s-head-hour']}>0800</div>
                <div className={styles['s-head-hour']}>1000</div>
                <div className={styles['s-head-hour']}>1200</div>
                <div className={styles['s-head-hour']}>1400</div>
                <div className={styles['s-head-hour']}>1600</div>
                <div className={styles['s-head-hour']}>1800</div>
                <div className={styles['s-head-hour']}>2000</div>
                <div className={styles['s-head-hour']}>2200</div>
            </div>
            <div
                className={styles['schedule']}
                style={{
                    height: `${(500 / 5) * totalOverlaps}px`,
                    maxHeight: '700px'
                }}
            >
                <div className={styles['s-legend']}>
                    {orderedActivities.map(
                        (overlapNActivities, index: number) => {
                            const height =
                                (100 / totalOverlaps) *
                                overlapNActivities.overlaps;
                            return (
                                <div
                                    className={styles['s-week-day']}
                                    style={{
                                        height: `${height}%`
                                    }}
                                    key={`days-legend-${index}`}
                                >
                                    {days[index]}
                                </div>
                            );
                        }
                    )}
                </div>
                <div className={styles['s-container']}>
                    <div className={styles['s-activities']}>
                        <Activities />
                    </div>
                    <div className={styles['background-col']}>
                        <Col gray={true} />
                        <Col gray={false} />
                        <Col gray={true} />
                        <Col gray={false} />
                        <Col gray={true} />
                        <Col gray={false} />
                        <Col gray={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(Timetable);
