interface CommonResponse<T> {
    data: T;
    message: string;
    success: boolean;
}