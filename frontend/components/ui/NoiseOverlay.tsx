export default function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4OcnJyMjIy0tLVzc3Org4Oqqqqnp6e8vLxycnL///+goKDv7+9wcHFubm5nbm5PrjS9ubm9ubn39/fR0dG4uLh0dHTIyMjJycnl5eV68/66AAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfeAg0NDRg99uY6AAAAnklEQVRIx2NgYGRkYmRhZGVmZXMAsRjYONk5OTmZ3EBSXFwZHBKcnJycHJxcXFycnJycXFxcXBkcEn6/fP8PD98/v1/fP0P3///P9P99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999996QWceAk670fRAAAAAElFTkSuQmCC")`,
        backgroundRepeat: "repeat",
        willChange: "transform",
        transform: "translate3d(0, 0, 0)",
      }}
    />
  );
}
