import { connect, disconnect } from "mongoose";
let MONGODB_URI;
if (process.env.SERVER_ENV === "PROD") {
    MONGODB_URI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.120dt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
}
else {
    MONGODB_URI = `mongodb://localhost:27017/open-ai`;
}
async function connectToDatabase() {
    try {
        await connect(MONGODB_URI);
    }
    catch (error) {
        console.log(error);
        throw new Error("Could not Connect To MongoDB");
    }
}
async function disconnectFromDatabase() {
    try {
        await disconnect();
    }
    catch (error) {
        console.log(error);
        throw new Error("Could not Disconnect From MongoDB");
    }
}
export { connectToDatabase, disconnectFromDatabase };
//# sourceMappingURL=connection.js.map