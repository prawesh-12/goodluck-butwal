import Script from "next/script";
import { gtmId } from "@/lib/integrations/analytics";
import { allSettings } from "@db/settings";

// The GA4 id lives in the container and the container id in settings, so neither needs a deploy.
export async function Analytics() {
  const configured = (await allSettings()).get("gtm_id");

  const id = gtmId(configured);
  if (!id) return null;

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}
