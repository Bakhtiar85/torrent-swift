import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {body} = req;
    console.log("Hello this is test", body);
    return res.status(200).json({
        message: "Attachment saved successfully",
        error: null,
        data: null,
    });
}