export default function WaveAnimation() {
    return (
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
            <svg
                className="relative block w-[200%] h-30 sm:h-37.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 2400 120"
                preserveAspectRatio="none"
            >
                {/* Wave Layer 1 */}
                <g className="animate-wave-slow">
                    <path
                        d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 C1350,80 1550,0 1800,40 C2050,80 2250,0 2400,40 L2400,120 L0,120 Z"
                        fill="rgba(255, 255, 255, 0.1)"
                    />
                </g>

                {/* Wave Layer 2 */}
                <g className="animate-wave-medium">
                    <path
                        d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 C1400,100 1600,20 1800,60 C2000,100 2200,20 2400,60 L2400,120 L0,120 Z"
                        fill="rgba(255, 255, 255, 0.15)"
                    />
                </g>

                {/* Wave Layer 3 */}
                <g className="animate-wave-fast">
                    <path
                        d="M0,80 C150,40 350,100 600,80 C850,60 1050,100 1200,80 C1350,40 1550,100 1800,80 C2050,60 2250,100 2400,80 L2400,120 L0,120 Z"
                        fill="rgba(255, 255, 255, 0.2)"
                    />
                </g>
            </svg>
        </div>
    );
}
