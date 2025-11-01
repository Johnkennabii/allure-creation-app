import { ReactNode } from "react";
import clsx from "clsx";
import { Link } from "react-router";
import { Card, CardDescription, CardTitle } from "../../ui/card";
import WithIndicators from "../../ui/carousel/WithIndicators";

export type CardInfoItem = {
  label: string;
  value: ReactNode;
};

export type CardThreeProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  images?: string[];
  fallbackImage?: string;
  infoItems?: CardInfoItem[];
  badges?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  autoPlayCarousel?: boolean;
  imageClassName?: string;
  bodyClassName?: string;
  overlayBadges?: ReactNode;
};

const DEFAULT_IMAGE = "/images/cards/card-03.png";
const DEFAULT_DESCRIPTION =
  "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum";

const DefaultFooter = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
  >
    <svg
      className="fill-current"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.88029 3.10905C8.54002 1.44932 11.231 1.44933 12.8907 3.10906C14.5504 4.76878 14.5504 7.45973 12.8907 9.11946L12.0654 9.94479L11.0047 8.88413L11.83 8.0588C12.904 6.98486 12.904 5.24366 11.83 4.16972C10.7561 3.09577 9.01489 3.09577 7.94095 4.16971L7.11562 4.99504L6.05496 3.93438L6.88029 3.10905ZM8.88339 11.0055L9.94405 12.0661L9.11946 12.8907C7.45973 14.5504 4.76878 14.5504 3.10905 12.8907C1.44933 11.231 1.44933 8.54002 3.10905 6.88029L3.93364 6.0557L4.9943 7.11636L4.16971 7.94095C3.09577 9.01489 3.09577 10.7561 4.16971 11.83C5.24366 12.904 6.98486 12.904 8.0588 11.83L8.88339 11.0055ZM9.94422 7.11599C10.2371 6.8231 10.2371 6.34823 9.94422 6.05533C9.65132 5.76244 9.17645 5.76244 8.88356 6.05533L6.05513 8.88376C5.76224 9.17665 5.76224 9.65153 6.05513 9.94442C6.34802 10.2373 6.8229 10.2373 7.11579 9.94442L9.94422 7.11599Z"
        fill=""
      />
    </svg>
    Card link
  </Link>
);

export default function CardThree({
  title = "Card title",
  subtitle,
  description = DEFAULT_DESCRIPTION,
  images,
  fallbackImage = DEFAULT_IMAGE,
  infoItems,
  badges,
  footer,
  children,
  autoPlayCarousel = true,
  imageClassName = "w-full h-60 object-cover",
  bodyClassName = "",
  overlayBadges,
}: CardThreeProps = {}) {
  const hasDescription = Boolean(description);
  const hasInfoItems = Array.isArray(infoItems) && infoItems.length > 0;
  const computedFooter = footer === undefined ? <DefaultFooter /> : footer;

  return (
    <Card>
      <div className="-mx-5 -mt-5 mb-5 overflow-hidden sm:-mx-6 sm:-mt-6">
        <div className="relative">
          <WithIndicators
            images={images}
            fallbackImage={fallbackImage}
            autoPlay={autoPlayCarousel}
            imageClassName={clsx(imageClassName, "rounded-none")}
            className="rounded-t-xl overflow-hidden"
          />
          {overlayBadges ? (
            <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-2">
              {overlayBadges}
            </div>
          ) : null}
        </div>
      </div>

      <div className={clsx("space-y-4", bodyClassName)}>
        {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}

        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {subtitle ? (
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
          {hasDescription ? <CardDescription>{description}</CardDescription> : null}
        </div>

        {hasInfoItems ? (
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {infoItems!.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {item.label}
                </dt>
                <dd className="text-sm text-gray-800 dark:text-gray-200">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {children}
      </div>

      {computedFooter ? (
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">{computedFooter}</div>
      ) : null}
    </Card>
  );
}
