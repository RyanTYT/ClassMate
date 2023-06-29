'use client'
import React, { useLayoutEffect, useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import styles from '@components/dashboard/layout/profileMenu.module.css';
import SignOut from '@components/dashboard/layout/SignOut';
import Link from "next/link";
import config from '@/config';
import PhotoRenderer from "../PhotoRenderer";
const { expressHost } = config;

export default function ProfileMenuButton() {
    const [username, setUsername] = useState<string | null>();
    const [photoArrBuffer, setPhotoArrBuffer] = useState<number[]>([]);
    useLayoutEffect(() => {
        setUsername(window['sessionStorage'].getItem("username"));
        axios.get(`${expressHost}/authorized/profile`, {
            headers: {
                Authorization: window['sessionStorage'].getItem("token")
            },
            params: {
                username: window['sessionStorage'].getItem("username")
            }
        })
            .then((res: AxiosResponse) => {
                if (res.status === 200) {
                    setPhotoArrBuffer(res.data.photo.data);
                }
            })
            .catch((err: AxiosError) => {
                alert("Sorry! A problem occured! Your email could not be found.");
                console.error(err)
            });
    }, []);
    const [isDropdownActive, setDropdownActive] = useState(false);
    const toggleDropdown = () => setDropdownActive(!isDropdownActive);

    return (
        <button className={styles["profile-btn"]} onClick={toggleDropdown} type="button">
            <PhotoRenderer arrBuffer={photoArrBuffer} alt="Profile" />
            <span>{username}</span>
            <div className={`${styles['dropdown-wrapper']} ${(isDropdownActive ? styles['active'] : '')}`} id='dropdownWrapper'>
                <div className={styles['dropdown-profile-details']}>
                    <span className={styles['dropdown-profile-details--name']}>{username}</span>
                </div>
                <div className={styles['dropdown-links']}>
                    <Link href='/settings'>Profile</Link>
                    <SignOut />
                </div>
            </div>
        </button>
    );
}
