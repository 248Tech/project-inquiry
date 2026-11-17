// Where submissions go. Fill in ONE of these, then commit.
//
// 1. endpoint: any service that accepts a JSON POST and emails you.
//    - Formspree: create a form at https://formspree.io, paste "https://formspree.io/f/xxxxxxx"
//    - Web3Forms: get a key at https://web3forms.com, set endpoint to
//      "https://api.web3forms.com/submit" and accessKey to your key
// 2. email: if no endpoint is set, "Send" opens the visitor's mail app
//    with the brief pre-filled, addressed to this address.
//
// If both are empty, the visitor can copy the brief to their clipboard.
window.INQUIRY_CONFIG = {
  endpoint: "",
  accessKey: "",
  email: "joe@248tech.com",
  brand: "248Tech",
  site: "https://248tech.github.io/",
};
