import nodemailer from "nodemailer";
import { NEWS_SUMMARY_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from "./templates";
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro,
  );

  const emailOptions = {
    from: `"Signalist" <jovan@zhou.com>`,
    to: email,
    subject: "Welcome to Signalist!",
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(emailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date,
  ).replace("{{newsContent}}", newsContent);

  const emailOptions = {
    from: `"Signalist" <jovan@zhou.com>`,
    to: email,
    subject: `📅 Signalist News Today - ${date}`,
    text: "Today's market news summary from Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(emailOptions);
};