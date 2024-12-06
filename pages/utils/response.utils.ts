// pages/utils/response.utils.ts
import { NextApiResponse } from 'next';
import { ApiResponse } from '@/types';

export const apiResponse = <T>(
    res: NextApiResponse,
    options: {
        success: boolean;
        statusCode: number;
        message: string;
        data?: T;
        error?: string;
    }
) => {
    const { success, statusCode, message, data, error } = options;

    const response: ApiResponse<T> = {
        success,
        message,
        ...(data && { data }),
        ...(error && { error }),
    };

    return res.status(statusCode).json(response);
};
