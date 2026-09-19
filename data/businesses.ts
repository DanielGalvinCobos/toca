export type Business = {
  id: string;
  name: string;
  slug: string;
  googleReviewUrl: string;
};

export const businesses: Business[] = [
  {
    id: "bar-pepe",
    name: "Bar Pepe",
    slug: "bar-pepe",
    googleReviewUrl: "https://www.google.com/",
  },
];