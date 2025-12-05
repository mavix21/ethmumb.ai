import { memo } from "react";

export const MumbaiBackground = memo(function MumbaiBackground() {
  return (
    <div className="pointer-events-none h-full w-full overflow-hidden">
      {/* Sky gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/10" />

      {/* Layer 1: Distant clouds - slowest, moving right */}
      <div className="animate-scroll-right-seamless absolute top-4 left-0 w-[200%] opacity-20 md:top-8">
        <div className="flex w-full">
          <div className="flex w-1/2 shrink-0 gap-24 md:gap-48">
            {[...Array<unknown>(4)].map((_, i) => (
              <CloudShape
                key={`cloud-1a-${i}`}
                className="h-8 w-16 md:h-16 md:w-32"
              />
            ))}
          </div>
          <div className="flex w-1/2 shrink-0 gap-24 md:gap-48">
            {[...Array<unknown>(4)].map((_, i) => (
              <CloudShape
                key={`cloud-1b-${i}`}
                className="h-8 w-16 md:h-16 md:w-32"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Layer 2: Mid clouds - slow */}
      <div className="animate-scroll-seamless-slow absolute top-12 left-0 w-[200%] opacity-30 md:top-20">
        <div className="flex w-full">
          <div className="flex w-1/2 shrink-0 items-center justify-around gap-32 md:gap-64">
            {[...Array<unknown>(3)].map((_, i) => (
              <CloudShape
                key={`cloud-2a-${i}`}
                className="h-6 w-12 md:h-12 md:w-24"
              />
            ))}
          </div>
          <div className="flex w-1/2 shrink-0 items-center justify-around gap-32 md:gap-64">
            {[...Array<unknown>(3)].map((_, i) => (
              <CloudShape
                key={`cloud-2b-${i}`}
                className="h-6 w-12 md:h-12 md:w-24"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Layer 3: Hot air balloons - medium speed with bob animation */}
      <div className="animate-scroll-seamless-medium absolute top-8 left-0 w-[200%] md:top-16">
        <div className="flex w-full">
          <div className="flex w-1/2 shrink-0 items-end justify-around">
            {[...Array<unknown>(2)].map((_, i) => (
              <div
                key={`balloon-a-${i}`}
                className="animate-bob"
                style={{ animationDelay: `${i * 0.7}s` }}
              >
                <HotAirBalloon
                  className="h-14 w-10 md:h-24 md:w-16"
                  variant={i % 2 === 0 ? "yellow" : "blue"}
                />
              </div>
            ))}
          </div>
          <div className="flex w-1/2 shrink-0 items-end justify-around">
            {[...Array<unknown>(2)].map((_, i) => (
              <div
                key={`balloon-b-${i}`}
                className="animate-bob"
                style={{ animationDelay: `${i * 0.7}s` }}
              >
                <HotAirBalloon
                  className="h-14 w-10 md:h-24 md:w-16"
                  variant={i % 2 === 0 ? "yellow" : "blue"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layer 4: Airplanes - moving forward (right) */}
      <div
        className="animate-scroll-right-seamless absolute top-6 left-0 w-[200%] md:top-12"
        style={{ animationDuration: "40s" }}
      >
        <div className="flex w-full">
          <div className="flex w-1/2 shrink-0 items-center justify-around">
            <Airplane className="h-6 w-12 md:h-10 md:w-20" direction="right" />
          </div>
          <div className="flex w-1/2 shrink-0 items-center justify-around">
            <Airplane className="h-6 w-12 md:h-10 md:w-20" direction="right" />
          </div>
        </div>
      </div>

      {/* Layer 5: Distant buildings silhouette - slow parallax */}
      <div className="animate-scroll-seamless-slow absolute bottom-28 left-0 w-[200%]">
        <div className="flex w-full">
          <DistantSkyline className="h-16 w-1/2 shrink-0 md:h-32" />
          <DistantSkyline className="h-16 w-1/2 shrink-0 md:h-32" />
        </div>
      </div>

      {/* Layer 6: Main Mumbai skyline with landmarks - medium speed */}
      <div className="animate-scroll-seamless-medium absolute bottom-16 left-0 w-[200%]">
        <div className="flex w-full">
          <MumbaiSkyline className="h-28 w-1/2 shrink-0 md:h-56" />
          <MumbaiSkyline className="h-28 w-1/2 shrink-0 md:h-56" />
        </div>
      </div>

      {/* Layer 7: Road with vehicles - fastest, foreground */}
      <div className="animate-scroll-seamless-fast absolute bottom-16 left-0 w-[200%]">
        <div className="flex w-full">
          <RoadWithVehicles className="h-10 w-1/2 shrink-0 md:h-12" />
          <RoadWithVehicles className="h-10 w-1/2 shrink-0 md:h-12" />
        </div>
      </div>

      {/* Fixed decorative elements that float */}
      <div className="animate-float-slow absolute top-[15%] right-[5%] hidden opacity-60 md:block">
        <EthereumDiamond className="h-10 w-8" />
      </div>
      <div
        className="animate-float absolute top-[25%] left-[8%] hidden opacity-50 md:block"
        style={{ animationDelay: "1s" }}
      >
        <EthereumDiamond className="h-8 w-6" />
      </div>
    </div>
  );
});

const CloudShape = memo(function CloudShape({
  className,
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 96 48" fill="white">
      <ellipse cx="24" cy="32" rx="20" ry="12" />
      <ellipse cx="48" cy="28" rx="24" ry="16" />
      <ellipse cx="72" cy="32" rx="18" ry="10" />
    </svg>
  );
});

const HotAirBalloon = memo(function HotAirBalloon({
  className,
  variant = "yellow",
}: {
  className?: string;
  variant?: "yellow" | "blue";
}) {
  const balloonColor = variant === "yellow" ? "#FFD600" : "#3FA9F5";
  const stripeColor = variant === "yellow" ? "#E2231A" : "#1C1C1C";

  return (
    <svg className={className} viewBox="0 0 64 96" fill="none">
      <ellipse cx="32" cy="28" rx="22" ry="28" fill={balloonColor} />
      <ellipse
        cx="32"
        cy="28"
        rx="15"
        ry="20"
        fill={stripeColor}
        opacity="0.25"
      />
      <path
        d="M18 52 L22 72 L42 72 L46 52"
        stroke="#1C1C1C"
        strokeWidth="2"
        fill="none"
      />
      <rect x="24" y="72" width="16" height="10" rx="2" fill="#1C1C1C" />
      <circle cx="8" cy="26" r="4" fill="#1C1C1C" />
      <circle cx="48" cy="26" r="4" fill="#1C1C1C" />
    </svg>
  );
});

const Airplane = memo(function Airplane({
  className,
  direction = "right",
}: {
  className?: string;
  direction?: "right" | "left";
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 40"
      fill="none"
      style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M70 20 L55 16 L20 20 L10 12 L8 14 L15 20 L8 26 L10 28 L20 20 L55 24 Z"
        fill="white"
      />
      <path d="M35 20 L30 12 L28 12 L32 20 L28 28 L30 28 Z" fill="white" />
      <circle cx="65" cy="20" r="3" fill="#3FA9F5" />
    </svg>
  );
});

const DistantSkyline = memo(function DistantSkyline({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 120"
      preserveAspectRatio="none"
      fill="rgba(0,0,0,0.08)"
    >
      <path d="M0 120 L0 80 L40 80 L40 60 L60 60 L60 40 L80 40 L80 60 L100 60 L100 80 L140 80 L140 50 L160 50 L160 30 L180 30 L180 50 L200 50 L200 70 L240 70 L240 90 L280 90 L280 60 L300 60 L300 40 L320 40 L320 60 L340 60 L340 80 L380 80 L380 100 L420 100 L420 70 L440 70 L440 50 L460 50 L460 70 L480 70 L480 90 L520 90 L520 60 L540 60 L540 40 L560 40 L560 20 L580 20 L580 40 L600 40 L600 60 L640 60 L640 80 L680 80 L680 50 L700 50 L700 30 L720 30 L720 50 L740 50 L740 70 L780 70 L780 90 L800 90 L800 120 Z" />
    </svg>
  );
});

const MumbaiSkyline = memo(function MumbaiSkyline({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 220"
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Ground/platform */}
      <rect x="0" y="200" width="800" height="20" fill="rgba(0,0,0,0.15)" />

      {/* Buildings silhouette */}
      <path
        d="M0 220 L0 180 L30 180 L30 150 L50 150 L50 130 L70 130 L70 150 L90 150 L90 170 L120 170 L120 140 L140 140 L140 110 L155 110 L155 80 L170 80 L170 110 L185 110 L185 140 L210 140 L210 170 L240 170 L240 180 
        L280 180 L280 160 L300 160 L300 130 L320 130 L320 100 L340 100 L340 70 L350 60 L360 70 L360 100 L380 100 L380 130 L400 130 L400 160 L420 160 L420 180
        L480 180 L480 150 L500 150 L500 120 L520 120 L520 90 L540 90 L540 60 L550 50 L560 60 L560 90 L580 90 L580 120 L600 120 L600 150 L620 150 L620 180
        L680 180 L680 160 L700 160 L700 130 L720 130 L720 100 L740 100 L740 130 L760 130 L760 160 L780 160 L780 180 L800 180 L800 220 Z"
        fill="rgba(0,0,0,0.12)"
      />

      {/* Gateway of India - centered landmark */}
      <g transform="translate(320, 70)">
        <rect x="0" y="80" width="120" height="70" fill="rgba(0,0,0,0.18)" />
        <rect x="15" y="50" width="90" height="40" fill="rgba(0,0,0,0.18)" />
        <rect x="25" y="25" width="70" height="35" fill="rgba(0,0,0,0.18)" />
        <path d="M45 0 L60 25 L75 0" fill="rgba(0,0,0,0.18)" />
        <rect x="35" y="100" width="20" height="45" fill="rgba(0,0,0,0.22)" />
        <rect x="65" y="100" width="20" height="45" fill="rgba(0,0,0,0.22)" />
      </g>

      {/* Taj Hotel dome silhouette */}
      <g transform="translate(80, 80)">
        <rect x="0" y="60" width="80" height="80" fill="rgba(0,0,0,0.15)" />
        <ellipse cx="40" cy="60" rx="35" ry="25" fill="rgba(0,0,0,0.15)" />
        <ellipse cx="40" cy="45" rx="20" ry="15" fill="rgba(0,0,0,0.15)" />
        <circle cx="40" cy="35" r="8" fill="rgba(0,0,0,0.15)" />
      </g>

      {/* Sea Link bridge cables */}
      <g transform="translate(550, 100)">
        <rect x="0" y="80" width="200" height="40" fill="rgba(0,0,0,0.1)" />
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="80"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="4"
        />
        <line
          x1="150"
          y1="0"
          x2="150"
          y2="80"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="4"
        />
        <path
          d="M50 0 Q100 40 150 0"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M50 15 Q100 50 150 15"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M50 30 Q100 60 150 30"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
});

const RoadWithVehicles = memo(function RoadWithVehicles({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 48"
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Road surface */}
      <rect x="0" y="20" width="800" height="28" fill="#1C1C1C" />
      {/* Road edge */}
      <rect x="0" y="16" width="800" height="6" fill="rgba(0,0,0,0.3)" />
      {/* Yellow dashed line */}
      <line
        x1="0"
        y1="32"
        x2="800"
        y2="32"
        stroke="#FFD600"
        strokeWidth="3"
        strokeDasharray="30 20"
      />

      {/* Auto rickshaw 1 */}
      <g transform="translate(50, 24)">
        <rect x="0" y="8" width="28" height="16" rx="3" fill="#00A859" />
        <rect x="5" y="10" width="10" height="8" fill="#3FA9F5" opacity="0.6" />
        <circle cx="6" cy="24" r="4" fill="#1C1C1C" />
        <circle cx="22" cy="24" r="4" fill="#1C1C1C" />
      </g>

      {/* BEST Bus */}
      <g transform="translate(200, 14)">
        <rect x="0" y="8" width="60" height="26" rx="3" fill="#E2231A" />
        <rect
          x="5"
          y="12"
          width="12"
          height="10"
          fill="#3FA9F5"
          opacity="0.5"
        />
        <rect
          x="20"
          y="12"
          width="12"
          height="10"
          fill="#3FA9F5"
          opacity="0.5"
        />
        <rect
          x="35"
          y="12"
          width="12"
          height="10"
          fill="#3FA9F5"
          opacity="0.5"
        />
        <rect x="50" y="12" width="8" height="10" fill="#FFD600" />
        <circle cx="12" cy="34" r="5" fill="#1C1C1C" />
        <circle cx="48" cy="34" r="5" fill="#1C1C1C" />
      </g>

      {/* Auto rickshaw 2 */}
      <g transform="translate(350, 24)">
        <rect x="0" y="8" width="28" height="16" rx="3" fill="#FFD600" />
        <rect x="5" y="10" width="10" height="8" fill="#3FA9F5" opacity="0.6" />
        <circle cx="6" cy="24" r="4" fill="#1C1C1C" />
        <circle cx="22" cy="24" r="4" fill="#1C1C1C" />
      </g>

      {/* Taxi */}
      <g transform="translate(500, 22)">
        <rect x="0" y="8" width="36" height="18" rx="4" fill="#1C1C1C" />
        <rect x="4" y="2" width="28" height="10" rx="3" fill="#FFD600" />
        <rect x="8" y="4" width="8" height="6" fill="#3FA9F5" opacity="0.5" />
        <rect x="20" y="4" width="8" height="6" fill="#3FA9F5" opacity="0.5" />
        <circle cx="8" cy="26" r="4" fill="#333" />
        <circle cx="28" cy="26" r="4" fill="#333" />
      </g>

      {/* Auto rickshaw 3 */}
      <g transform="translate(650, 24)">
        <rect x="0" y="8" width="28" height="16" rx="3" fill="#00A859" />
        <rect x="5" y="10" width="10" height="8" fill="#3FA9F5" opacity="0.6" />
        <circle cx="6" cy="24" r="4" fill="#1C1C1C" />
        <circle cx="22" cy="24" r="4" fill="#1C1C1C" />
      </g>
    </svg>
  );
});

const EthereumDiamond = memo(function EthereumDiamond({
  className,
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 32 40" fill="none">
      <path d="M16 0 L32 20 L16 28 L0 20 Z" fill="#3FA9F5" opacity="0.8" />
      <path d="M16 28 L32 20 L16 40 L0 20 Z" fill="#3FA9F5" opacity="0.5" />
      <path d="M16 0 L16 28 L0 20 Z" fill="white" opacity="0.3" />
    </svg>
  );
});
