"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/toaster";
import { DEFAULT_LOCALE, getLocaleMessages } from "@/lib/i18n";

export function Providers({
  children,
  locale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  locale?: string;
}): React.ReactElement {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const messages = React.useMemo(() => getLocaleMessages(locale), [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            {messages.a11y.skipToContent}
          </a>
          {children}
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
