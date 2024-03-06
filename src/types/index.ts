type SuccessType = {
    success: string | undefined;
  };
  
type ErrorType = {
    error: string | undefined;
  };
export  type StatusType = SuccessType | ErrorType | undefined ;