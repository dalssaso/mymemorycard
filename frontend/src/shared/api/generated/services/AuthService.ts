/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * @returns any User registered successfully
     * @throws ApiError
     */
    public static postApiV1AuthRegister({
        requestBody,
    }: {
        requestBody?: {
            username: string;
            email: string;
            password: string;
        },
    }): CancelablePromise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        token: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                409: `User already exists`,
            },
        });
    }
    /**
     * @returns any User logged in successfully
     * @throws ApiError
     */
    public static postApiV1AuthLogin({
        requestBody,
    }: {
        requestBody?: {
            username: string;
            password: string;
        },
    }): CancelablePromise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        token: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
            },
        });
    }
    /**
     * @returns any Current user
     * @throws ApiError
     */
    public static getApiV1AuthMe(): CancelablePromise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/me',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
}
