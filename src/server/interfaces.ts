export interface IUserBodyFull {
    id: string;
    username: string;
    age: number;
    hobbies: string[];
  }
  
  export interface IUserBody {
    username: string;
    age: number | string;
    hobbies: string[];
  }
  
  export interface IUserList {
    users: IUserBodyFull[];
  }
