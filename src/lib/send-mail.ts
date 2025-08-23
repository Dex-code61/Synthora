import { resend } from "./resend";



export const sendMail = async ({
    email,
    to,
    subject,
    from,
    text
}: {
    email: string,
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