import { useMemo } from "react";
import clsx from "clsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export type WithIndicatorsProps = {
  images?: string[];
  fallbackImage?: string;
  autoPlay?: boolean;
  className?: string;
  imageClassName?: string;
};

const DEFAULT_FALLBACK = "/images/cards/card-03.png";

export default function WithIndicators({
  images,
  fallbackImage = DEFAULT_FALLBACK,
  autoPlay = true,
  className = "rounded-t-xl overflow-hidden bg-gray-900/5 dark:bg-white/[0.03]",
  imageClassName = "w-full h-60 object-cover",
}: WithIndicatorsProps) {
  const slides = useMemo(() => {
    const sanitized = Array.isArray(images)
      ? images
          .map((url) => (typeof url === "string" ? url.trim() : ""))
          .filter((url) => url.length > 0)
      : [];
    if (sanitized.length > 0) return sanitized;
    return fallbackImage ? [fallbackImage] : [DEFAULT_FALLBACK];
  }, [images, fallbackImage]);

  const modules = autoPlay ? [Pagination, Autoplay] : [Pagination];

  return (
    <div className={clsx("relative carouselThree", className)}>
      <Swiper
        modules={modules}
        autoplay={
          autoPlay
            ? {
                delay: 5000,
                disableOnInteraction: false,
              }
            : undefined
        }
        pagination={{ clickable: true }}
        loop={slides.length > 1}
      >
        {slides.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`}>
            <img
              src={src}
              alt={`Carousel slide ${index + 1}`}
              className={clsx("block", imageClassName)}
              loading="lazy"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
