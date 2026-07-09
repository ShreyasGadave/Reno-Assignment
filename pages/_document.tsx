import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head>
        <meta name="description" content="A simple notice board application for managing announcement notices." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="min-h-full bg-background text-foreground">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
