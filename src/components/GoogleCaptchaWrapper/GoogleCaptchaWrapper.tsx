import type { ReactNode } from "react";

interface GoogleCaptchaWrapperProps {
  children: ReactNode;
}

const GoogleCaptchaWrapper = ({ children }: GoogleCaptchaWrapperProps) => {
  return <>{children}</>;
};

export default GoogleCaptchaWrapper;


