import FingerprintJS from "@fingerprintjs/fingerprintjs";
import throttle from "lodash.throttle";
import UAParser from "ua-parser-js";
import { onMounted, onUnmounted, ref } from "vue";

const sendEvent = async (data, path) => {
  const url = `http://localhost:3080/v1/${path}`;

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const trackBackend = async (data) => {
  const configData = {
    APP_ID: data.APP_ID,
    APP_SECRET: data.APP_SECRET,
    service: data.service || "backend",
  };
  sendEvent(
    {
      ...configData,
      type: "backend",
      data,
    },
    "event/backend"
  );
};

export default async function tracker(Vue, options, router) {
  if (!options.APP_ID) {
    throw new Error("Please provide the APP_ID");
  }

  const uaParser = new UAParser();
  const idVisitor = (await (await FingerprintJS.load()).get()).visitorId;

  if (!idVisitor) {
    throw new Error("Error id visitor");
  }
  const configData = {
    APP_ID: options.APP_ID,
    service: options.service || "website",
    visitorId: idVisitor,
    uaParser: uaParser.getResult(),
    session: 1,
    // api endpoint
  };

  router.afterEach((to, from) => {
    const { fullPath, meta, query } = to;
    sendEvent(
      {
        ...configData,
        type: "pageview",
        data: {
          fullPath,
          meta,
          query,
        },
      },
      "event/front"
    );
  });
  const eventListeners = {};

  Vue.directive("track", {
    mounted(el, binding) {
      eventListeners[binding.arg] = () => {
        // resetInactivityTimer();
        sendEvent(
          {
            ...configData,
            type: "tag",
            event: binding.modifiers,
            tag: binding.arg,
          },
          "event/front"
        );
      };
      for (const modifier in binding.modifiers) {
        el.addEventListener(modifier, eventListeners[binding.arg]);
      }
    },
    unmounted(el, binding) {
      for (const modifier in binding.modifiers) {
        el.removeEventListener(modifier, eventListeners[binding.arg]);
      }
      delete eventListeners[binding.arg];
    },
  });
}

export async function useMousePosition(options) {
  console.log("useMousePosition");
  console.log(options, "gegjhgjh");
  console.log(configData);
  if (!options.APP_ID) {
    throw new Error("Please provide the APP_ID");
  }

  const uaParser = new UAParser();
  const idVisitor = (await (await FingerprintJS.load()).get()).visitorId;

  if (!idVisitor) {
    throw new Error("Error id visitor");
  }
  const configData = {
    APP_ID: options.APP_ID,
    service: options.service || "website",
    visitorId: idVisitor,
    uaParser: uaParser.getResult(),
    session: 1,
    // api endpoint
  };

  const x = ref(0);
  const y = ref(0);

  const updateMousePosition = throttle((event) => {
    x.value = event.clientX;
    y.value = event.clientY;

    sendEvent(
      {
        ...configData,
        type: "mouse",
        data: {
          x: event.clientX,
          y: event.clientY,
        },
      },
      "event/front"
    );
  }, 100);

  onMounted(() => {
    window.addEventListener("mousemove", updateMousePosition);
  });

  onUnmounted(() => {
    window.removeEventListener("mousemove", updateMousePosition);
  });

  return { x, y };
}
