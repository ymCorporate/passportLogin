const users=[]
const UserService= {
    async createUser(userData){
        users.push(userData)
    },
    async getUserByEmail(email){
        return users.find(user=>user.email===email);
    },
};

export default UserService;