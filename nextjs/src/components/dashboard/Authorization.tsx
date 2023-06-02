'use client'
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ReactElement, useEffect, useState } from 'react';
import Loading from '@components/Loading';
import config from '@/config';

interface childrenElems {
    children?: ReactElement | ReactElement[];
}
export default function AuthorizationComponent({ children }: childrenElems): ReactElement {
    let [isAuthorized, setIsAuthorized] = useState(false);
    let [isLoading, setIsLoading] = useState(true);

    // Perform the authentication logic, e.g., send JWT token to the server
    // and validate it
    useEffect(() => {
        const updateAuthorization = async () => {
            await axios.get(`${config.expressHost}/authenticate`, {
                headers: {
                    Authorization: window['sessionStorage'].getItem("token")
                }
            })
                .then((res: AxiosResponse) => {
                    if (res.status === 200) {
                        // Render the children components if the user is authenticated
                        setIsAuthorized(true);
                        setIsLoading(false);
                    } else {
                        window.location.href = '/';
                        console.log('Authorization error', res.statusText);
                    }
                })
                .catch((err: AxiosError) => {
                    console.error('Axios authentication error:', err);
                });
        };
        updateAuthorization();
    }, []);
    if (isLoading) {
        return (<Loading />);
    }
    if (isAuthorized) {
        return (<>{children}</>);
    } else {
        return (<div><h1>You are an unauthorized user!</h1></div>);

    }
};
