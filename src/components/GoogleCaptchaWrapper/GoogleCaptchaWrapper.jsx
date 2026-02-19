import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const GoogleCaptchaWrapper = ({ children }) => {
    const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={recaptchaKey}
            scriptProps={{
                async: false,
                defer: false,
                appendTo: "head",
                nonce: undefined,
            }}
        >
            {children}
        </GoogleReCaptchaProvider>
    )
}

export default GoogleCaptchaWrapper


