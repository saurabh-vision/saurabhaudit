export const BLOG_PATH = "src/content/blog";

interface Site {
  website: string;
  author: string;
  email: string;
  profile: string;
  desc: string;
  title: string;
  tagline: string;
  bio: string;
  ogImage: string;
  lightAndDarkMode: boolean;
  postPerIndex: number;
  postPerPage: number;
  scheduledPostMargin: number;
  showArchives: boolean;
  showBackButton: boolean;
  editPost: {
    enabled: boolean;
    text: string;
    url: string;
  };
  dynamicOgImage: boolean;
  lang: string;
  timezone: string;
  substackUrl: string;
  substackName: string;
  twitterHandle: string;
}

export const SITE: Site = {
  website: "https://saurabhaudit.com/",
  author: "Saurabh",
  email: "",
  profile: "https://saurabhaudit.com/about",
  desc: "Saurabh builds Android apps and web tools (ClipVault, ScanXpert, and downloadfrom.app) and writes about how software systems scale.",
  title: "Saurabh",
  tagline: "Android apps, open-source projects and notes on how systems scale.",
  bio: "I build Android apps and web tools, including the open-source ClipVault, ScanXpert, and downloadfrom.app. I write about how systems scale in my newsletter, How Systems Scale.",
  ogImage: "og-default.png",
  lightAndDarkMode: true,
  postPerIndex: 10,
  postPerPage: 10,
  scheduledPostMargin: 15 * 60 * 1000,
  showArchives: false,
  showBackButton: false,
  editPost: {
    enabled: false,
    text: "Edit on GitHub",
    url: "https://github.com/saurabh-vision/saurabhaudit.com/edit/main/",
  },
  dynamicOgImage: true,
  lang: "en",
  timezone: "America/Los_Angeles",
  substackUrl: "https://howsystemsscale.substack.com",
  substackName: "How Systems Scale",
  twitterHandle: "@saurabhvsn",
};
