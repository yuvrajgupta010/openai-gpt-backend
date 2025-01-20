import axios from "axios";
import User from "../models/User.js";
import { configureOpenAI } from "../config/openai-config.js";
export const generateChatCompletion = async (req, res, next) => {
    const { message } = req.body;
    try {
        const user = await User.findById(res.locals.jwtData.id);
        if (!user)
            return res
                .status(401)
                .json({ message: "User not registered OR Token malfunctioned" });
        // grab chats of user
        const chats = user.chats.map(({ role, content }) => ({
            role,
            content,
        }));
        chats.push({ content: message, role: "user" });
        user.chats.push({ content: message, role: "user" });
        // send all chats with new one to openAI API
        const config = configureOpenAI();
        const openaiAxios = config.baseOptions.adapter;
        // Use Axios for streaming
        const streamResponse = await axios({
            url: `https://api.openai.com/v1/chat/completions`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
            },
            data: {
                model: "gpt-3.5-turbo",
                messages: chats,
                stream: true,
            },
            responseType: "stream",
        });
        // Setup response headers for SSE
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        let fullResponse = "";
        // Handle incoming stream data
        streamResponse.data.on("data", (chunk) => {
            const lines = chunk
                .toString()
                .split("\n")
                .filter((line) => line.trim() !== "");
            for (const line of lines) {
                const data = line.replace(/^data: /, "");
                if (data === "[DONE]") {
                    res.end(); // End the stream when complete
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || "";
                    fullResponse += content;
                    res.write(content); // Send chunk to client
                }
                catch (error) {
                    console.error("Error parsing stream chunk", error);
                }
            }
        });
        // Handle the stream ending
        streamResponse.data.on("end", async () => {
            user.chats.push({ role: "assistant", content: fullResponse });
            await user.save();
            res.end(); // Close the connection properly
        });
        // Handle stream errors
        streamResponse.data.on("error", (error) => {
            console.error("Stream Error:", error);
            res.status(500).end("Something went wrong with streaming.");
        });
        /////////////////////////
        // previous
        ////////////////////////
        // const openai = new OpenAIApi(config);
        // // get latest response
        // const chatResponse = await openai.createChatCompletion({
        //   model: "gpt-3.5-turbo",
        //   messages: chats,
        // });
        // user.chats.push(chatResponse.data.choices[0].message);
        // await user.save();
        // return res.status(200).json({ chats: user.chats });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
export const sendChatsToUser = async (req, res, next) => {
    try {
        //user token check
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).send("User not registered OR Token malfunctioned");
        }
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        return res.status(200).json({ message: "OK", chats: user.chats });
    }
    catch (error) {
        console.log(error);
        return res.status(200).json({ message: "ERROR", cause: error.message });
    }
};
export const deleteChats = async (req, res, next) => {
    try {
        //user token check
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).send("User not registered OR Token malfunctioned");
        }
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        //@ts-ignore
        user.chats = [];
        await user.save();
        return res.status(200).json({ message: "OK" });
    }
    catch (error) {
        console.log(error);
        return res.status(200).json({ message: "ERROR", cause: error.message });
    }
};
//# sourceMappingURL=chat-controllers.js.map