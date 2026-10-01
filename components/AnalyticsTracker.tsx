"use client";

import { useEffect, useRef } from "react";

type AnalyticsTrackerProps = {
  businessId: string;
};

function getSource() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("src");

  if (source === "nfc" || source === "qr") {
    return source;
  }

  return "direct";
}

function sendEvent(
  businessId: string,
  source: string,
  event: "visit" | "google_click"
) {
  const data = JSON.stringify({
    businessId,
    source,
    event,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([data], {
      type: "application/json",
    });

    const sent = navigator.sendBeacon("/api/analytics", blob);

    if (sent) {
      return;
    }
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
    keepalive: true,
  }).catch(() => {});
}

export default function AnalyticsTracker({
  businessId,
}: AnalyticsTrackerProps) {
  const hasTrackedVisit = useRef(false);

  useEffect(() => {
    if (hasTrackedVisit.current) {
      return;
    }

    hasTrackedVisit.current = true;

    const source = getSource();

    sendEvent(businessId, source, "visit");

    const googleButton = document.querySelector(
      "[data-google-review]"
    );

    if (!googleButton) {
      return;
    }

    const handleGoogleClick = () => {
      sendEvent(businessId, source, "google_click");
    };

    googleButton.addEventListener("click", handleGoogleClick);

    return () => {
      googleButton.removeEventListener("click", handleGoogleClick);
    };
  }, [businessId]);

  return null;
}