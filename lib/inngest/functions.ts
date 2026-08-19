import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { inngest } from "./client";
import {
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
  NEWS_SUMMARY_EMAIL_PROMPT,
} from "./prompts";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { formatDateToday, getFormattedTodayDate } from "../utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email", triggers: { event: "app/user.created" } },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
        `;
    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      `{{userProfile}}`,
      userProfile,
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-3.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });
    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist!";
      //EMAIL SENDING LOGIC
      const { name, email } = event.data;
      await sendWelcomeEmail({ name, email, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  {
    id: "daily-news-summary",
    triggers: [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  },
  async ({ step }) => {
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found",
      };
    }
    const results = await step.run(`fetch-user-news`, async () => {
      const perUser: Array<{ user: User; news: MarketNewsArticle[] }> = [];
      for (const user of users) {
        // Step 2: Get watchlist symbols
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let news: MarketNewsArticle[] = await getNews(symbols);
          news = (news || []).slice(0, 6);
          if (!news && news == 0) {
            news = await getNews();
            news = (news || []).slice(0, 6);
          }
          perUser.push({ user, news });
        } catch (error) {
          console.error(
            `Daily-news: Error preparing user news`,
            user.email,
            error,
          );
          perUser.push({ user, news: [] });
        }
      }
      return perUser;
    });
    //step 3 : summarize view ai
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];
    for (const { user, news } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(news, null, 2),
        );

        const res = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-3.5-flash-lite" }),
          body: {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          },
        });

        const part = res?.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          part && "text" in part ? part.text : null || "No market News";

        userNewsSummaries.push({ user, newsContent });
      } catch (error) {
        console.error("Failed to summarize news for : ", user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    //step 4 : sending personalized emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;
          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent: newsContent ?? "No market News",
          });
        }),
      );

      return true;
    });
    return {
      success: true,
      message: "Daily news email sent successfully",
    } as const;
  },
);
