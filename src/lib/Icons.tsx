// Icons from https://react-icons.github.io/
import * as React from "react";

export const TbLine = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        {...props}
    >
        <path d="M4 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0M16 6a2 2 0 1 0 4 0 2 2 0 1 0-4 0M7.5 16.5l9-9" />
    </svg>
)

export const IoAnalyticsOutline = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={0}
      viewBox="0 0 512 512"
      {...props}
    >
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
        d="m344 280 88-88m-200 24 64 64M80 320l104-104"
      />
      <circle
        cx={456}
        cy={168}
        r={24}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
      />
      <circle
        cx={320}
        cy={304}
        r={24}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
      />
      <circle
        cx={208}
        cy={192}
        r={24}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
      />
      <circle
        cx={56}
        cy={344}
        r={24}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
      />
    </svg>
  )

  export const TbLineDashed = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M5 12h2" />
      <path d="M17 12h2" />
      <path d="M11 12h2" />
    </svg>
  )