/**
 * @deprecated Use the new email service from src/lib/email/service.ts instead
 * This file is kept for backward compatibility but should not be used for new code.
 */

import { resend } from "./resend";

export const sendMail = async ({
    to,
    subject,
    from,
    text
}: {
    to: string,
    subject: string,
    from?: string,
    text: string
}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: from || "noreply@terminus-digit.store",
            to: [to],
            subject: subject,
            html: `<strong>${text}</strong>`,
          });

        if(data){
            return {
                success: true,
                message: "Email sent successfully",
                error: null
            }
        }

        return {
            success: false,
            message: "Email not sent",
            error
        }
    } catch (error) {
        return {
            success: false,
            message: "Something went wrong !",
            error
        }
    }
}