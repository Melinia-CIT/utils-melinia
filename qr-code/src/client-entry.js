var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// node_modules/hono/dist/jsx/constants.js
var DOM_RENDERER = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_STASH = /* @__PURE__ */ Symbol("STASH");
var DOM_INTERNAL_TAG = /* @__PURE__ */ Symbol("INTERNAL");
var DOM_MEMO = /* @__PURE__ */ Symbol("MEMO");

// node_modules/hono/dist/jsx/dom/utils.js
var setInternalTagFlag = (fn) => {
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
};

// node_modules/hono/dist/jsx/dom/context.js
var createContextProviderFunction = (values) => ({ value, children }) => {
  if (!children) {
    return;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
};
var createContext = (defaultValue) => {
  const values = [defaultValue];
  const context = createContextProviderFunction(values);
  context.values = values;
  context.Provider = context;
  globalContexts.push(context);
  return context;
};

// node_modules/hono/dist/jsx/context.js
var globalContexts = [];
var useContext = (context) => {
  return context.values.at(-1);
};

// node_modules/hono/dist/jsx/intrinsic-element/common.js
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";

// node_modules/hono/dist/jsx/children.js
var toArray = (children) => Array.isArray(children) ? children : [children];

// node_modules/hono/dist/jsx/utils.js
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = (key) => normalizeElementKeyMap.get(key) || key;
var styleObjectForEach = (style, fn) => {
  for (const [k, v] of Object.entries(style)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    fn(key, v == null ? null : typeof v === "number" ? !key.match(/^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/) ? `${v}px` : `${v}` : v);
  }
};

// node_modules/hono/dist/jsx/dom/render.js
var HONO_PORTAL_ELEMENT = "_hp";
var eventAliasMap = {
  Change: "Input",
  DoubleClick: "DblClick"
};
var nameSpaceMap = {
  svg: "2000/svg",
  math: "1998/Math/MathML"
};
var buildDataStack = [];
var refCleanupMap = /* @__PURE__ */ new WeakMap;
var nameSpaceContext = undefined;
var getNameSpaceContext2 = () => nameSpaceContext;
var isNodeString = (node) => ("t" in node);
var eventCache = {
  onClick: ["click", false]
};
var getEventSpec = (key) => {
  if (!key.startsWith("on")) {
    return;
  }
  if (eventCache[key]) {
    return eventCache[key];
  }
  const match = key.match(/^on([A-Z][a-zA-Z]+?(?:PointerCapture)?)(Capture)?$/);
  if (match) {
    const [, eventName, capture] = match;
    return eventCache[key] = [(eventAliasMap[eventName] || eventName).toLowerCase(), !!capture];
  }
  return;
};
var toAttributeName = (element, key) => nameSpaceContext && element instanceof SVGElement && /[A-Z]/.test(key) && ((key in element.style) || key.match(/^(?:o|pai|str|u|ve)/)) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var applyProps = (container, attributes, oldAttributes) => {
  attributes ||= {};
  for (let key in attributes) {
    const value = attributes[key];
    if (key !== "children" && (!oldAttributes || oldAttributes[key] !== value)) {
      key = normalizeIntrinsicElementKey(key);
      const eventSpec = getEventSpec(key);
      if (eventSpec) {
        if (oldAttributes?.[key] !== value) {
          if (oldAttributes) {
            container.removeEventListener(eventSpec[0], oldAttributes[key], eventSpec[1]);
          }
          if (value != null) {
            if (typeof value !== "function") {
              throw new Error(`Event handler for "${key}" is not a function`);
            }
            container.addEventListener(eventSpec[0], value, eventSpec[1]);
          }
        }
      } else if (key === "dangerouslySetInnerHTML" && value) {
        container.innerHTML = value.__html;
      } else if (key === "ref") {
        let cleanup;
        if (typeof value === "function") {
          cleanup = value(container) || (() => value(null));
        } else if (value && "current" in value) {
          value.current = container;
          cleanup = () => value.current = null;
        }
        refCleanupMap.set(container, cleanup);
      } else if (key === "style") {
        const style = container.style;
        if (typeof value === "string") {
          style.cssText = value;
        } else {
          style.cssText = "";
          if (value != null) {
            styleObjectForEach(value, style.setProperty.bind(style));
          }
        }
      } else {
        if (key === "value") {
          const nodeName = container.nodeName;
          if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT") {
            container.value = value === null || value === undefined || value === false ? null : value;
            if (nodeName === "TEXTAREA") {
              container.textContent = value;
              continue;
            } else if (nodeName === "SELECT") {
              if (container.selectedIndex === -1) {
                container.selectedIndex = 0;
              }
              continue;
            }
          }
        } else if (key === "checked" && container.nodeName === "INPUT" || key === "selected" && container.nodeName === "OPTION") {
          container[key] = value;
        }
        const k = toAttributeName(container, key);
        if (value === null || value === undefined || value === false) {
          container.removeAttribute(k);
        } else if (value === true) {
          container.setAttribute(k, "");
        } else if (typeof value === "string" || typeof value === "number") {
          container.setAttribute(k, value);
        } else {
          container.setAttribute(k, value.toString());
        }
      }
    }
  }
  if (oldAttributes) {
    for (let key in oldAttributes) {
      const value = oldAttributes[key];
      if (key !== "children" && !(key in attributes)) {
        key = normalizeIntrinsicElementKey(key);
        const eventSpec = getEventSpec(key);
        if (eventSpec) {
          container.removeEventListener(eventSpec[0], value, eventSpec[1]);
        } else if (key === "ref") {
          refCleanupMap.get(container)?.();
        } else {
          container.removeAttribute(toAttributeName(container, key));
        }
      }
    }
  }
};
var invokeTag = (context, node) => {
  node[DOM_STASH][0] = 0;
  buildDataStack.push([context, node]);
  const func = node.tag[DOM_RENDERER] || node.tag;
  const props = func.defaultProps ? {
    ...func.defaultProps,
    ...node.props
  } : node.props;
  try {
    return [func.call(null, props)];
  } finally {
    buildDataStack.pop();
  }
};
var getNextChildren = (node, container, nextChildren, childrenToRemove, callbacks) => {
  if (node.vR?.length) {
    childrenToRemove.push(...node.vR);
    delete node.vR;
  }
  if (typeof node.tag === "function") {
    node[DOM_STASH][1][STASH_EFFECT]?.forEach((data) => callbacks.push(data));
  }
  node.vC.forEach((child) => {
    if (isNodeString(child)) {
      nextChildren.push(child);
    } else {
      if (typeof child.tag === "function" || child.tag === "") {
        child.c = container;
        const currentNextChildrenIndex = nextChildren.length;
        getNextChildren(child, container, nextChildren, childrenToRemove, callbacks);
        if (child.s) {
          for (let i = currentNextChildrenIndex;i < nextChildren.length; i++) {
            nextChildren[i].s = true;
          }
          child.s = false;
        }
      } else {
        nextChildren.push(child);
        if (child.vR?.length) {
          childrenToRemove.push(...child.vR);
          delete child.vR;
        }
      }
    }
  });
};
var findInsertBefore = (node) => {
  for (;; node = node.tag === HONO_PORTAL_ELEMENT || !node.vC || !node.pP ? node.nN : node.vC[0]) {
    if (!node) {
      return null;
    }
    if (node.tag !== HONO_PORTAL_ELEMENT && node.e) {
      return node.e;
    }
  }
};
var removeNode = (node) => {
  if (!isNodeString(node)) {
    node[DOM_STASH]?.[1][STASH_EFFECT]?.forEach((data) => data[2]?.());
    refCleanupMap.get(node.e)?.();
    if (node.p === 2) {
      node.vC?.forEach((n) => n.p = 2);
    }
    node.vC?.forEach(removeNode);
  }
  if (!node.p) {
    node.e?.remove();
    delete node.e;
  }
  if (typeof node.tag === "function") {
    updateMap.delete(node);
    fallbackUpdateFnArrayMap.delete(node);
    delete node[DOM_STASH][3];
    node.a = true;
  }
};
var apply = (node, container, isNew) => {
  node.c = container;
  applyNodeObject(node, container, isNew);
};
var findChildNodeIndex = (childNodes, child) => {
  if (!child) {
    return;
  }
  for (let i = 0, len = childNodes.length;i < len; i++) {
    if (childNodes[i] === child) {
      return i;
    }
  }
  return;
};
var cancelBuild = /* @__PURE__ */ Symbol();
var applyNodeObject = (node, container, isNew) => {
  const next = [];
  const remove = [];
  const callbacks = [];
  getNextChildren(node, container, next, remove, callbacks);
  remove.forEach(removeNode);
  const childNodes = isNew ? undefined : container.childNodes;
  let offset;
  let insertBeforeNode = null;
  if (isNew) {
    offset = -1;
  } else if (!childNodes.length) {
    offset = 0;
  } else {
    const offsetByNextNode = findChildNodeIndex(childNodes, findInsertBefore(node.nN));
    if (offsetByNextNode !== undefined) {
      insertBeforeNode = childNodes[offsetByNextNode];
      offset = offsetByNextNode;
    } else {
      offset = findChildNodeIndex(childNodes, next.find((n) => n.tag !== HONO_PORTAL_ELEMENT && n.e)?.e) ?? -1;
    }
    if (offset === -1) {
      isNew = true;
    }
  }
  for (let i = 0, len = next.length;i < len; i++, offset++) {
    const child = next[i];
    let el;
    if (child.s && child.e) {
      el = child.e;
      child.s = false;
    } else {
      const isNewLocal = isNew || !child.e;
      if (isNodeString(child)) {
        if (child.e && child.d) {
          child.e.textContent = child.t;
        }
        child.d = false;
        el = child.e ||= document.createTextNode(child.t);
      } else {
        el = child.e ||= child.n ? document.createElementNS(child.n, child.tag) : document.createElement(child.tag);
        applyProps(el, child.props, child.pP);
        applyNodeObject(child, el, isNewLocal);
      }
    }
    if (child.tag === HONO_PORTAL_ELEMENT) {
      offset--;
    } else if (isNew) {
      if (!el.parentNode) {
        container.appendChild(el);
      }
    } else if (childNodes[offset] !== el && childNodes[offset - 1] !== el) {
      if (childNodes[offset + 1] === el) {
        container.appendChild(childNodes[offset]);
      } else {
        container.insertBefore(el, insertBeforeNode || childNodes[offset] || null);
      }
    }
  }
  if (node.pP) {
    delete node.pP;
  }
  if (callbacks.length) {
    const useLayoutEffectCbs = [];
    const useEffectCbs = [];
    callbacks.forEach(([, useLayoutEffectCb, , useEffectCb, useInsertionEffectCb]) => {
      if (useLayoutEffectCb) {
        useLayoutEffectCbs.push(useLayoutEffectCb);
      }
      if (useEffectCb) {
        useEffectCbs.push(useEffectCb);
      }
      useInsertionEffectCb?.();
    });
    useLayoutEffectCbs.forEach((cb) => cb());
    if (useEffectCbs.length) {
      requestAnimationFrame(() => {
        useEffectCbs.forEach((cb) => cb());
      });
    }
  }
};
var isSameContext = (oldContexts, newContexts) => !!(oldContexts && oldContexts.length === newContexts.length && oldContexts.every((ctx, i) => ctx[1] === newContexts[i][1]));
var fallbackUpdateFnArrayMap = /* @__PURE__ */ new WeakMap;
var build = (context, node, children) => {
  const buildWithPreviousChildren = !children && node.pC;
  if (children) {
    node.pC ||= node.vC;
  }
  let foundErrorHandler;
  try {
    children ||= typeof node.tag == "function" ? invokeTag(context, node) : toArray(node.props.children);
    if (children[0]?.tag === "" && children[0][DOM_ERROR_HANDLER]) {
      foundErrorHandler = children[0][DOM_ERROR_HANDLER];
      context[5].push([context, foundErrorHandler, node]);
    }
    const oldVChildren = buildWithPreviousChildren ? [...node.pC] : node.vC ? [...node.vC] : undefined;
    const vChildren = [];
    let prevNode;
    for (let i = 0;i < children.length; i++) {
      if (Array.isArray(children[i])) {
        children.splice(i, 1, ...children[i].flat());
      }
      let child = buildNode(children[i]);
      if (child) {
        if (typeof child.tag === "function" && !child.tag[DOM_INTERNAL_TAG]) {
          if (globalContexts.length > 0) {
            child[DOM_STASH][2] = globalContexts.map((c) => [c, c.values.at(-1)]);
          }
          if (context[5]?.length) {
            child[DOM_STASH][3] = context[5].at(-1);
          }
        }
        let oldChild;
        if (oldVChildren && oldVChildren.length) {
          const i2 = oldVChildren.findIndex(isNodeString(child) ? (c) => isNodeString(c) : child.key !== undefined ? (c) => c.key === child.key && c.tag === child.tag : (c) => c.tag === child.tag);
          if (i2 !== -1) {
            oldChild = oldVChildren[i2];
            oldVChildren.splice(i2, 1);
          }
        }
        if (oldChild) {
          if (isNodeString(child)) {
            if (oldChild.t !== child.t) {
              oldChild.t = child.t;
              oldChild.d = true;
            }
            child = oldChild;
          } else {
            const pP = oldChild.pP = oldChild.props;
            oldChild.props = child.props;
            oldChild.f ||= child.f || node.f;
            if (typeof child.tag === "function") {
              const oldContexts = oldChild[DOM_STASH][2];
              oldChild[DOM_STASH][2] = child[DOM_STASH][2] || [];
              oldChild[DOM_STASH][3] = child[DOM_STASH][3];
              if (!oldChild.f && ((oldChild.o || oldChild) === child.o || oldChild.tag[DOM_MEMO]?.(pP, oldChild.props)) && isSameContext(oldContexts, oldChild[DOM_STASH][2])) {
                oldChild.s = true;
              }
            }
            child = oldChild;
          }
        } else if (!isNodeString(child) && nameSpaceContext) {
          const ns = useContext(nameSpaceContext);
          if (ns) {
            child.n = ns;
          }
        }
        if (!isNodeString(child) && !child.s) {
          build(context, child);
          delete child.f;
        }
        vChildren.push(child);
        if (prevNode && !prevNode.s && !child.s) {
          for (let p = prevNode;p && !isNodeString(p); p = p.vC?.at(-1)) {
            p.nN = child;
          }
        }
        prevNode = child;
      }
    }
    node.vR = buildWithPreviousChildren ? [...node.vC, ...oldVChildren || []] : oldVChildren || [];
    node.vC = vChildren;
    if (buildWithPreviousChildren) {
      delete node.pC;
    }
  } catch (e) {
    node.f = true;
    if (e === cancelBuild) {
      if (foundErrorHandler) {
        return;
      } else {
        throw e;
      }
    }
    const [errorHandlerContext, errorHandler, errorHandlerNode] = node[DOM_STASH]?.[3] || [];
    if (errorHandler) {
      const fallbackUpdateFn = () => update([0, false, context[2]], errorHandlerNode);
      const fallbackUpdateFnArray = fallbackUpdateFnArrayMap.get(errorHandlerNode) || [];
      fallbackUpdateFnArray.push(fallbackUpdateFn);
      fallbackUpdateFnArrayMap.set(errorHandlerNode, fallbackUpdateFnArray);
      const fallback = errorHandler(e, () => {
        const fnArray = fallbackUpdateFnArrayMap.get(errorHandlerNode);
        if (fnArray) {
          const i = fnArray.indexOf(fallbackUpdateFn);
          if (i !== -1) {
            fnArray.splice(i, 1);
            return fallbackUpdateFn();
          }
        }
      });
      if (fallback) {
        if (context[0] === 1) {
          context[1] = true;
        } else {
          build(context, errorHandlerNode, [fallback]);
          if ((errorHandler.length === 1 || context !== errorHandlerContext) && errorHandlerNode.c) {
            apply(errorHandlerNode, errorHandlerNode.c, false);
            return;
          }
        }
        throw cancelBuild;
      }
    }
    throw e;
  } finally {
    if (foundErrorHandler) {
      context[5].pop();
    }
  }
};
var buildNode = (node) => {
  if (node === undefined || node === null || typeof node === "boolean") {
    return;
  } else if (typeof node === "string" || typeof node === "number") {
    return { t: node.toString(), d: true };
  } else {
    if ("vR" in node) {
      node = {
        tag: node.tag,
        props: node.props,
        key: node.key,
        f: node.f,
        type: node.tag,
        ref: node.props.ref,
        o: node.o || node
      };
    }
    if (typeof node.tag === "function") {
      node[DOM_STASH] = [0, []];
    } else {
      const ns = nameSpaceMap[node.tag];
      if (ns) {
        nameSpaceContext ||= createContext("");
        node.props.children = [
          {
            tag: nameSpaceContext,
            props: {
              value: node.n = `http://www.w3.org/${ns}`,
              children: node.props.children
            }
          }
        ];
      }
    }
    return node;
  }
};
var replaceContainer = (node, from, to) => {
  if (node.c === from) {
    node.c = to;
    node.vC.forEach((child) => replaceContainer(child, from, to));
  }
};
var updateSync = (context, node) => {
  node[DOM_STASH][2]?.forEach(([c, v]) => {
    c.values.push(v);
  });
  try {
    build(context, node, undefined);
  } catch {
    return;
  }
  if (node.a) {
    delete node.a;
    return;
  }
  node[DOM_STASH][2]?.forEach(([c]) => {
    c.values.pop();
  });
  if (context[0] !== 1 || !context[1]) {
    apply(node, node.c, false);
  }
};
var updateMap = /* @__PURE__ */ new WeakMap;
var currentUpdateSets = [];
var update = async (context, node) => {
  context[5] ||= [];
  const existing = updateMap.get(node);
  if (existing) {
    existing[0](undefined);
  }
  let resolve;
  const promise = new Promise((r) => resolve = r);
  updateMap.set(node, [
    resolve,
    () => {
      if (context[2]) {
        context[2](context, node, (context2) => {
          updateSync(context2, node);
        }).then(() => resolve(node));
      } else {
        updateSync(context, node);
        resolve(node);
      }
    }
  ]);
  if (currentUpdateSets.length) {
    currentUpdateSets.at(-1).add(node);
  } else {
    await Promise.resolve();
    const latest = updateMap.get(node);
    if (latest) {
      updateMap.delete(node);
      latest[1]();
    }
  }
  return promise;
};
var renderNode = (node, container) => {
  const context = [];
  context[5] = [];
  context[4] = true;
  build(context, node, undefined);
  context[4] = false;
  const fragment = document.createDocumentFragment();
  apply(node, fragment, true);
  replaceContainer(node, fragment, container);
  container.replaceChildren(fragment);
};
var render = (jsxNode, container) => {
  renderNode(buildNode({ tag: "", props: { children: jsxNode } }), container);
};
var createPortal = (children, container, key) => ({
  tag: HONO_PORTAL_ELEMENT,
  props: {
    children
  },
  key,
  e: container,
  p: 1
});

// node_modules/hono/dist/jsx/hooks/index.js
var STASH_SATE = 0;
var STASH_EFFECT = 1;
var STASH_CALLBACK = 2;
var STASH_MEMO = 3;
var resolvedPromiseValueMap = /* @__PURE__ */ new WeakMap;
var isDepsChanged = (prevDeps, deps) => !prevDeps || !deps || prevDeps.length !== deps.length || deps.some((dep, i) => dep !== prevDeps[i]);
var updateHook = undefined;
var pendingStack = [];
var useState = (initialState) => {
  const resolveInitialState = () => typeof initialState === "function" ? initialState() : initialState;
  const buildData = buildDataStack.at(-1);
  if (!buildData) {
    return [resolveInitialState(), () => {}];
  }
  const [, node] = buildData;
  const stateArray = node[DOM_STASH][1][STASH_SATE] ||= [];
  const hookIndex = node[DOM_STASH][0]++;
  return stateArray[hookIndex] ||= [
    resolveInitialState(),
    (newState) => {
      const localUpdateHook = updateHook;
      const stateData = stateArray[hookIndex];
      if (typeof newState === "function") {
        newState = newState(stateData[0]);
      }
      if (!Object.is(newState, stateData[0])) {
        stateData[0] = newState;
        if (pendingStack.length) {
          const [pendingType, pendingPromise] = pendingStack.at(-1);
          Promise.all([
            pendingType === 3 ? node : update([pendingType, false, localUpdateHook], node),
            pendingPromise
          ]).then(([node2]) => {
            if (!node2 || !(pendingType === 2 || pendingType === 3)) {
              return;
            }
            const lastVC = node2.vC;
            const addUpdateTask = () => {
              setTimeout(() => {
                if (lastVC !== node2.vC) {
                  return;
                }
                update([pendingType === 3 ? 1 : 0, false, localUpdateHook], node2);
              });
            };
            requestAnimationFrame(addUpdateTask);
          });
        } else {
          update([0, false, localUpdateHook], node);
        }
      }
    }
  ];
};
var useCallback = (callback, deps) => {
  const buildData = buildDataStack.at(-1);
  if (!buildData) {
    return callback;
  }
  const [, node] = buildData;
  const callbackArray = node[DOM_STASH][1][STASH_CALLBACK] ||= [];
  const hookIndex = node[DOM_STASH][0]++;
  const prevDeps = callbackArray[hookIndex];
  if (isDepsChanged(prevDeps?.[1], deps)) {
    callbackArray[hookIndex] = [callback, deps];
  } else {
    callback = callbackArray[hookIndex][0];
  }
  return callback;
};
var use = (promise) => {
  const cachedRes = resolvedPromiseValueMap.get(promise);
  if (cachedRes) {
    if (cachedRes.length === 2) {
      throw cachedRes[1];
    }
    return cachedRes[0];
  }
  promise.then((res) => resolvedPromiseValueMap.set(promise, [res]), (e) => resolvedPromiseValueMap.set(promise, [undefined, e]));
  throw promise;
};
var useMemo = (factory, deps) => {
  const buildData = buildDataStack.at(-1);
  if (!buildData) {
    return factory();
  }
  const [, node] = buildData;
  const memoArray = node[DOM_STASH][1][STASH_MEMO] ||= [];
  const hookIndex = node[DOM_STASH][0]++;
  const prevDeps = memoArray[hookIndex];
  if (isDepsChanged(prevDeps?.[1], deps)) {
    memoArray[hookIndex] = [factory(), deps];
  }
  return memoArray[hookIndex][0];
};

// node_modules/hono/dist/jsx/dom/intrinsic-element/components.js
var exports_components2 = {};
__export(exports_components2, {
  title: () => title,
  style: () => style,
  script: () => script,
  meta: () => meta,
  link: () => link,
  input: () => input,
  form: () => form,
  composeRef: () => composeRef,
  clearCache: () => clearCache,
  button: () => button
});

// node_modules/hono/dist/jsx/dom/hooks/index.js
var FormContext = createContext({
  pending: false,
  data: null,
  method: null,
  action: null
});
var actions = /* @__PURE__ */ new Set;
var registerAction = (action) => {
  actions.add(action);
  action.finally(() => actions.delete(action));
};

// node_modules/hono/dist/jsx/dom/intrinsic-element/components.js
var clearCache = () => {
  blockingPromiseMap = /* @__PURE__ */ Object.create(null);
  createdElements = /* @__PURE__ */ Object.create(null);
};
var composeRef = (ref, cb) => {
  return useMemo(() => (e) => {
    let refCleanup;
    if (ref) {
      if (typeof ref === "function") {
        refCleanup = ref(e) || (() => {
          ref(null);
        });
      } else if (ref && "current" in ref) {
        ref.current = e;
        refCleanup = () => {
          ref.current = null;
        };
      }
    }
    const cbCleanup = cb(e);
    return () => {
      cbCleanup?.();
      refCleanup?.();
    };
  }, [ref]);
};
var blockingPromiseMap = /* @__PURE__ */ Object.create(null);
var createdElements = /* @__PURE__ */ Object.create(null);
var documentMetadataTag = (tag, props, preserveNodeType, supportSort, supportBlocking) => {
  if (props?.itemProp) {
    return {
      tag,
      props,
      type: tag,
      ref: props.ref
    };
  }
  const head = document.head;
  let { onLoad, onError, precedence, blocking, ...restProps } = props;
  let element = null;
  let created = false;
  const deDupeKeys = deDupeKeyMap[tag];
  let existingElements = undefined;
  if (deDupeKeys.length > 0) {
    const tags = head.querySelectorAll(tag);
    LOOP:
      for (const e of tags) {
        for (const key of deDupeKeyMap[tag]) {
          if (e.getAttribute(key) === props[key]) {
            element = e;
            break LOOP;
          }
        }
      }
    if (!element) {
      const cacheKey = deDupeKeys.reduce((acc, key) => props[key] === undefined ? acc : `${acc}-${key}-${props[key]}`, tag);
      created = !createdElements[cacheKey];
      element = createdElements[cacheKey] ||= (() => {
        const e = document.createElement(tag);
        for (const key of deDupeKeys) {
          if (props[key] !== undefined) {
            e.setAttribute(key, props[key]);
          }
          if (props.rel) {
            e.setAttribute("rel", props.rel);
          }
        }
        return e;
      })();
    }
  } else {
    existingElements = head.querySelectorAll(tag);
  }
  precedence = supportSort ? precedence ?? "" : undefined;
  if (supportSort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const insert = useCallback((e) => {
    if (deDupeKeys.length > 0) {
      let found = false;
      for (const existingElement of head.querySelectorAll(tag)) {
        if (found && existingElement.getAttribute(dataPrecedenceAttr) !== precedence) {
          head.insertBefore(e, existingElement);
          return;
        }
        if (existingElement.getAttribute(dataPrecedenceAttr) === precedence) {
          found = true;
        }
      }
      head.appendChild(e);
    } else if (existingElements) {
      let found = false;
      for (const existingElement of existingElements) {
        if (existingElement === e) {
          found = true;
          break;
        }
      }
      if (!found) {
        head.insertBefore(e, head.contains(existingElements[0]) ? existingElements[0] : head.querySelector(tag));
      }
      existingElements = undefined;
    }
  }, [precedence]);
  const ref = composeRef(props.ref, (e) => {
    const key = deDupeKeys[0];
    if (preserveNodeType === 2) {
      e.innerHTML = "";
    }
    if (created || existingElements) {
      insert(e);
    }
    if (!onError && !onLoad) {
      return;
    }
    let promise = blockingPromiseMap[e.getAttribute(key)] ||= new Promise((resolve, reject) => {
      e.addEventListener("load", resolve);
      e.addEventListener("error", reject);
    });
    if (onLoad) {
      promise = promise.then(onLoad);
    }
    if (onError) {
      promise = promise.catch(onError);
    }
    promise.catch(() => {});
  });
  if (supportBlocking && blocking === "render") {
    const key = deDupeKeyMap[tag][0];
    if (props[key]) {
      const value = props[key];
      const promise = blockingPromiseMap[value] ||= new Promise((resolve, reject) => {
        insert(element);
        element.addEventListener("load", resolve);
        element.addEventListener("error", reject);
      });
      use(promise);
    }
  }
  const jsxNode = {
    tag,
    type: tag,
    props: {
      ...restProps,
      ref
    },
    ref
  };
  jsxNode.p = preserveNodeType;
  if (element) {
    jsxNode.e = element;
  }
  return createPortal(jsxNode, head);
};
var title = (props) => {
  const nameSpaceContext2 = getNameSpaceContext2();
  const ns = nameSpaceContext2 && useContext(nameSpaceContext2);
  if (ns?.endsWith("svg")) {
    return {
      tag: "title",
      props,
      type: "title",
      ref: props.ref
    };
  }
  return documentMetadataTag("title", props, undefined, false, false);
};
var script = (props) => {
  if (!props || ["src", "async"].some((k) => !props[k])) {
    return {
      tag: "script",
      props,
      type: "script",
      ref: props.ref
    };
  }
  return documentMetadataTag("script", props, 1, false, true);
};
var style = (props) => {
  if (!props || !["href", "precedence"].every((k) => (k in props))) {
    return {
      tag: "style",
      props,
      type: "style",
      ref: props.ref
    };
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", props, 2, true, true);
};
var link = (props) => {
  if (!props || ["onLoad", "onError"].some((k) => (k in props)) || props.rel === "stylesheet" && (!("precedence" in props) || ("disabled" in props))) {
    return {
      tag: "link",
      props,
      type: "link",
      ref: props.ref
    };
  }
  return documentMetadataTag("link", props, 1, "precedence" in props, true);
};
var meta = (props) => {
  return documentMetadataTag("meta", props, undefined, false, false);
};
var customEventFormAction = /* @__PURE__ */ Symbol();
var form = (props) => {
  const { action, ...restProps } = props;
  if (typeof action !== "function") {
    restProps.action = action;
  }
  const [state, setState] = useState([null, false]);
  const onSubmit = useCallback(async (ev) => {
    const currentAction = ev.isTrusted ? action : ev.detail[customEventFormAction];
    if (typeof currentAction !== "function") {
      return;
    }
    ev.preventDefault();
    const formData = new FormData(ev.target);
    setState([formData, true]);
    const actionRes = currentAction(formData);
    if (actionRes instanceof Promise) {
      registerAction(actionRes);
      await actionRes;
    }
    setState([null, true]);
  }, []);
  const ref = composeRef(props.ref, (el) => {
    el.addEventListener("submit", onSubmit);
    return () => {
      el.removeEventListener("submit", onSubmit);
    };
  });
  const [data, isDirty] = state;
  state[1] = false;
  return {
    tag: FormContext,
    props: {
      value: {
        pending: data !== null,
        data,
        method: data ? "post" : null,
        action: data ? action : null
      },
      children: {
        tag: "form",
        props: {
          ...restProps,
          ref
        },
        type: "form",
        ref
      }
    },
    f: isDirty
  };
};
var formActionableElement = (tag, {
  formAction,
  ...props
}) => {
  if (typeof formAction === "function") {
    const onClick = useCallback((ev) => {
      ev.preventDefault();
      ev.currentTarget.form.dispatchEvent(new CustomEvent("submit", { detail: { [customEventFormAction]: formAction } }));
    }, []);
    props.ref = composeRef(props.ref, (el) => {
      el.addEventListener("click", onClick);
      return () => {
        el.removeEventListener("click", onClick);
      };
    });
  }
  return {
    tag,
    props,
    type: tag,
    ref: props.ref
  };
};
var input = (props) => formActionableElement("input", props);
var button = (props) => formActionableElement("button", props);
Object.assign(domRenderers, {
  title,
  script,
  style,
  link,
  meta,
  form,
  input,
  button
});

// node_modules/hono/dist/jsx/dom/jsx-dev-runtime.js
var jsxDEV = (tag, props, key) => {
  if (typeof tag === "string" && exports_components2[tag]) {
    tag = exports_components2[tag];
  }
  return {
    tag,
    type: tag,
    props,
    key,
    ref: props.ref
  };
};

// src/app.js
var __defProp2 = Object.defineProperty;
var __export2 = (target, all) => {
  for (var name in all)
    __defProp2(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw2 = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var escapeRe = /[&<>'"]/;
var stringBufferToString2 = async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1;; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer2(r, buf);
      str = buf[0];
    }
  }
  return raw2(str, callbacks);
};
var escapeToBuffer2 = (str, buffer) => {
  const match = str.search(escapeRe);
  if (match === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match;index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
};
var resolveCallbackSync2 = (str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) {
    return raw2(await resStr, callbacks);
  } else {
    return resStr;
  }
};
var DOM_RENDERER2 = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER2 = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_STASH2 = /* @__PURE__ */ Symbol("STASH");
var DOM_INTERNAL_TAG2 = /* @__PURE__ */ Symbol("INTERNAL");
var DOM_MEMO2 = /* @__PURE__ */ Symbol("MEMO");
var setInternalTagFlag2 = (fn) => {
  fn[DOM_INTERNAL_TAG2] = true;
  return fn;
};
var createContextProviderFunction2 = (values) => ({ value, children }) => {
  if (!children) {
    return;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag2(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag2(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER2] = (err) => {
    values.pop();
    throw err;
  };
  return res;
};
var createContext3 = (defaultValue) => {
  const values = [defaultValue];
  const context = createContextProviderFunction2(values);
  context.values = values;
  context.Provider = context;
  globalContexts2.push(context);
  return context;
};
var globalContexts2 = [];
var createContext22 = (defaultValue) => {
  const values = [defaultValue];
  const context = (props) => {
    values.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode2("", {}, props.children) : props.children).toString() : "";
    } finally {
      values.pop();
    }
    if (string instanceof Promise) {
      return string.then((resString) => raw2(resString, resString.callbacks));
    } else {
      return raw2(string);
    }
  };
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER2] = createContextProviderFunction2(values);
  globalContexts2.push(context);
  return context;
};
var useContext2 = (context) => {
  return context.values.at(-1);
};
var deDupeKeyMap2 = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers2 = {};
var dataPrecedenceAttr2 = "data-precedence";
var toArray2 = (children) => Array.isArray(children) ? children : [children];
var normalizeElementKeyMap2 = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey2 = (key) => normalizeElementKeyMap2.get(key) || key;
var styleObjectForEach2 = (style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    fn(key, v == null ? null : typeof v === "number" ? !key.match(/^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/) ? `${v}px` : `${v}` : v);
  }
};
var nameSpaceContext2 = undefined;
var toSVGAttributeName = (key) => /[A-Z]/.test(key) && key.match(/^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = (children, buffer) => {
  for (let i = 0, len = children.length;i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer2(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === undefined) {
      continue;
    } else if (child instanceof JSXNode2) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
};
var JSXNode2 = class {
  tag;
  props;
  key;
  children;
  isEscaped = true;
  localContexts;
  constructor(tag, props, children) {
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    const buffer = [""];
    this.localContexts?.forEach(([context, value]) => {
      context.values.push(value);
    });
    try {
      this.toStringToBuffer(buffer);
    } finally {
      this.localContexts?.forEach(([context]) => {
        context.values.pop();
      });
    }
    return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync2(raw2(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString2(buffer, buffer.callbacks);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = nameSpaceContext2 && useContext2(nameSpaceContext2) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey2(key)) : (key) => normalizeIntrinsicElementKey2(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (key === "children") {} else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach2(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer2(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer2(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === undefined) {} else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw2(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer2(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFragmentNode2 = class extends JSXNode2 {
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var exports_components22 = {};
__export2(exports_components22, {
  title: () => title2,
  style: () => style2,
  script: () => script2,
  meta: () => meta2,
  link: () => link2,
  input: () => input2,
  form: () => form2,
  composeRef: () => composeRef2,
  clearCache: () => clearCache2,
  button: () => button2
});
var HONO_PORTAL_ELEMENT2 = "_hp";
var eventAliasMap2 = {
  Change: "Input",
  DoubleClick: "DblClick"
};
var nameSpaceMap2 = {
  svg: "2000/svg",
  math: "1998/Math/MathML"
};
var buildDataStack2 = [];
var refCleanupMap2 = /* @__PURE__ */ new WeakMap;
var nameSpaceContext22 = undefined;
var getNameSpaceContext22 = () => nameSpaceContext22;
var isNodeString2 = (node) => ("t" in node);
var eventCache2 = {
  onClick: ["click", false]
};
var getEventSpec2 = (key) => {
  if (!key.startsWith("on")) {
    return;
  }
  if (eventCache2[key]) {
    return eventCache2[key];
  }
  const match = key.match(/^on([A-Z][a-zA-Z]+?(?:PointerCapture)?)(Capture)?$/);
  if (match) {
    const [, eventName, capture] = match;
    return eventCache2[key] = [(eventAliasMap2[eventName] || eventName).toLowerCase(), !!capture];
  }
  return;
};
var toAttributeName2 = (element, key) => nameSpaceContext22 && element instanceof SVGElement && /[A-Z]/.test(key) && ((key in element.style) || key.match(/^(?:o|pai|str|u|ve)/)) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var applyProps2 = (container, attributes, oldAttributes) => {
  attributes ||= {};
  for (let key in attributes) {
    const value = attributes[key];
    if (key !== "children" && (!oldAttributes || oldAttributes[key] !== value)) {
      key = normalizeIntrinsicElementKey2(key);
      const eventSpec = getEventSpec2(key);
      if (eventSpec) {
        if (oldAttributes?.[key] !== value) {
          if (oldAttributes) {
            container.removeEventListener(eventSpec[0], oldAttributes[key], eventSpec[1]);
          }
          if (value != null) {
            if (typeof value !== "function") {
              throw new Error(`Event handler for "${key}" is not a function`);
            }
            container.addEventListener(eventSpec[0], value, eventSpec[1]);
          }
        }
      } else if (key === "dangerouslySetInnerHTML" && value) {
        container.innerHTML = value.__html;
      } else if (key === "ref") {
        let cleanup;
        if (typeof value === "function") {
          cleanup = value(container) || (() => value(null));
        } else if (value && "current" in value) {
          value.current = container;
          cleanup = () => value.current = null;
        }
        refCleanupMap2.set(container, cleanup);
      } else if (key === "style") {
        const style2 = container.style;
        if (typeof value === "string") {
          style2.cssText = value;
        } else {
          style2.cssText = "";
          if (value != null) {
            styleObjectForEach2(value, style2.setProperty.bind(style2));
          }
        }
      } else {
        if (key === "value") {
          const nodeName = container.nodeName;
          if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT") {
            container.value = value === null || value === undefined || value === false ? null : value;
            if (nodeName === "TEXTAREA") {
              container.textContent = value;
              continue;
            } else if (nodeName === "SELECT") {
              if (container.selectedIndex === -1) {
                container.selectedIndex = 0;
              }
              continue;
            }
          }
        } else if (key === "checked" && container.nodeName === "INPUT" || key === "selected" && container.nodeName === "OPTION") {
          container[key] = value;
        }
        const k = toAttributeName2(container, key);
        if (value === null || value === undefined || value === false) {
          container.removeAttribute(k);
        } else if (value === true) {
          container.setAttribute(k, "");
        } else if (typeof value === "string" || typeof value === "number") {
          container.setAttribute(k, value);
        } else {
          container.setAttribute(k, value.toString());
        }
      }
    }
  }
  if (oldAttributes) {
    for (let key in oldAttributes) {
      const value = oldAttributes[key];
      if (key !== "children" && !(key in attributes)) {
        key = normalizeIntrinsicElementKey2(key);
        const eventSpec = getEventSpec2(key);
        if (eventSpec) {
          container.removeEventListener(eventSpec[0], value, eventSpec[1]);
        } else if (key === "ref") {
          refCleanupMap2.get(container)?.();
        } else {
          container.removeAttribute(toAttributeName2(container, key));
        }
      }
    }
  }
};
var invokeTag2 = (context, node) => {
  node[DOM_STASH2][0] = 0;
  buildDataStack2.push([context, node]);
  const func = node.tag[DOM_RENDERER2] || node.tag;
  const props = func.defaultProps ? {
    ...func.defaultProps,
    ...node.props
  } : node.props;
  try {
    return [func.call(null, props)];
  } finally {
    buildDataStack2.pop();
  }
};
var getNextChildren2 = (node, container, nextChildren, childrenToRemove, callbacks) => {
  if (node.vR?.length) {
    childrenToRemove.push(...node.vR);
    delete node.vR;
  }
  if (typeof node.tag === "function") {
    node[DOM_STASH2][1][STASH_EFFECT2]?.forEach((data) => callbacks.push(data));
  }
  node.vC.forEach((child) => {
    if (isNodeString2(child)) {
      nextChildren.push(child);
    } else {
      if (typeof child.tag === "function" || child.tag === "") {
        child.c = container;
        const currentNextChildrenIndex = nextChildren.length;
        getNextChildren2(child, container, nextChildren, childrenToRemove, callbacks);
        if (child.s) {
          for (let i = currentNextChildrenIndex;i < nextChildren.length; i++) {
            nextChildren[i].s = true;
          }
          child.s = false;
        }
      } else {
        nextChildren.push(child);
        if (child.vR?.length) {
          childrenToRemove.push(...child.vR);
          delete child.vR;
        }
      }
    }
  });
};
var findInsertBefore2 = (node) => {
  for (;; node = node.tag === HONO_PORTAL_ELEMENT2 || !node.vC || !node.pP ? node.nN : node.vC[0]) {
    if (!node) {
      return null;
    }
    if (node.tag !== HONO_PORTAL_ELEMENT2 && node.e) {
      return node.e;
    }
  }
};
var removeNode2 = (node) => {
  if (!isNodeString2(node)) {
    node[DOM_STASH2]?.[1][STASH_EFFECT2]?.forEach((data) => data[2]?.());
    refCleanupMap2.get(node.e)?.();
    if (node.p === 2) {
      node.vC?.forEach((n) => n.p = 2);
    }
    node.vC?.forEach(removeNode2);
  }
  if (!node.p) {
    node.e?.remove();
    delete node.e;
  }
  if (typeof node.tag === "function") {
    updateMap2.delete(node);
    fallbackUpdateFnArrayMap2.delete(node);
    delete node[DOM_STASH2][3];
    node.a = true;
  }
};
var apply2 = (node, container, isNew) => {
  node.c = container;
  applyNodeObject2(node, container, isNew);
};
var findChildNodeIndex2 = (childNodes, child) => {
  if (!child) {
    return;
  }
  for (let i = 0, len = childNodes.length;i < len; i++) {
    if (childNodes[i] === child) {
      return i;
    }
  }
  return;
};
var cancelBuild2 = /* @__PURE__ */ Symbol();
var applyNodeObject2 = (node, container, isNew) => {
  const next = [];
  const remove = [];
  const callbacks = [];
  getNextChildren2(node, container, next, remove, callbacks);
  remove.forEach(removeNode2);
  const childNodes = isNew ? undefined : container.childNodes;
  let offset;
  let insertBeforeNode = null;
  if (isNew) {
    offset = -1;
  } else if (!childNodes.length) {
    offset = 0;
  } else {
    const offsetByNextNode = findChildNodeIndex2(childNodes, findInsertBefore2(node.nN));
    if (offsetByNextNode !== undefined) {
      insertBeforeNode = childNodes[offsetByNextNode];
      offset = offsetByNextNode;
    } else {
      offset = findChildNodeIndex2(childNodes, next.find((n) => n.tag !== HONO_PORTAL_ELEMENT2 && n.e)?.e) ?? -1;
    }
    if (offset === -1) {
      isNew = true;
    }
  }
  for (let i = 0, len = next.length;i < len; i++, offset++) {
    const child = next[i];
    let el;
    if (child.s && child.e) {
      el = child.e;
      child.s = false;
    } else {
      const isNewLocal = isNew || !child.e;
      if (isNodeString2(child)) {
        if (child.e && child.d) {
          child.e.textContent = child.t;
        }
        child.d = false;
        el = child.e ||= document.createTextNode(child.t);
      } else {
        el = child.e ||= child.n ? document.createElementNS(child.n, child.tag) : document.createElement(child.tag);
        applyProps2(el, child.props, child.pP);
        applyNodeObject2(child, el, isNewLocal);
      }
    }
    if (child.tag === HONO_PORTAL_ELEMENT2) {
      offset--;
    } else if (isNew) {
      if (!el.parentNode) {
        container.appendChild(el);
      }
    } else if (childNodes[offset] !== el && childNodes[offset - 1] !== el) {
      if (childNodes[offset + 1] === el) {
        container.appendChild(childNodes[offset]);
      } else {
        container.insertBefore(el, insertBeforeNode || childNodes[offset] || null);
      }
    }
  }
  if (node.pP) {
    delete node.pP;
  }
  if (callbacks.length) {
    const useLayoutEffectCbs = [];
    const useEffectCbs = [];
    callbacks.forEach(([, useLayoutEffectCb, , useEffectCb, useInsertionEffectCb]) => {
      if (useLayoutEffectCb) {
        useLayoutEffectCbs.push(useLayoutEffectCb);
      }
      if (useEffectCb) {
        useEffectCbs.push(useEffectCb);
      }
      useInsertionEffectCb?.();
    });
    useLayoutEffectCbs.forEach((cb) => cb());
    if (useEffectCbs.length) {
      requestAnimationFrame(() => {
        useEffectCbs.forEach((cb) => cb());
      });
    }
  }
};
var isSameContext2 = (oldContexts, newContexts) => !!(oldContexts && oldContexts.length === newContexts.length && oldContexts.every((ctx, i) => ctx[1] === newContexts[i][1]));
var fallbackUpdateFnArrayMap2 = /* @__PURE__ */ new WeakMap;
var build2 = (context, node, children) => {
  const buildWithPreviousChildren = !children && node.pC;
  if (children) {
    node.pC ||= node.vC;
  }
  let foundErrorHandler;
  try {
    children ||= typeof node.tag == "function" ? invokeTag2(context, node) : toArray2(node.props.children);
    if (children[0]?.tag === "" && children[0][DOM_ERROR_HANDLER2]) {
      foundErrorHandler = children[0][DOM_ERROR_HANDLER2];
      context[5].push([context, foundErrorHandler, node]);
    }
    const oldVChildren = buildWithPreviousChildren ? [...node.pC] : node.vC ? [...node.vC] : undefined;
    const vChildren = [];
    let prevNode;
    for (let i = 0;i < children.length; i++) {
      if (Array.isArray(children[i])) {
        children.splice(i, 1, ...children[i].flat());
      }
      let child = buildNode2(children[i]);
      if (child) {
        if (typeof child.tag === "function" && !child.tag[DOM_INTERNAL_TAG2]) {
          if (globalContexts2.length > 0) {
            child[DOM_STASH2][2] = globalContexts2.map((c) => [c, c.values.at(-1)]);
          }
          if (context[5]?.length) {
            child[DOM_STASH2][3] = context[5].at(-1);
          }
        }
        let oldChild;
        if (oldVChildren && oldVChildren.length) {
          const i2 = oldVChildren.findIndex(isNodeString2(child) ? (c) => isNodeString2(c) : child.key !== undefined ? (c) => c.key === child.key && c.tag === child.tag : (c) => c.tag === child.tag);
          if (i2 !== -1) {
            oldChild = oldVChildren[i2];
            oldVChildren.splice(i2, 1);
          }
        }
        if (oldChild) {
          if (isNodeString2(child)) {
            if (oldChild.t !== child.t) {
              oldChild.t = child.t;
              oldChild.d = true;
            }
            child = oldChild;
          } else {
            const pP = oldChild.pP = oldChild.props;
            oldChild.props = child.props;
            oldChild.f ||= child.f || node.f;
            if (typeof child.tag === "function") {
              const oldContexts = oldChild[DOM_STASH2][2];
              oldChild[DOM_STASH2][2] = child[DOM_STASH2][2] || [];
              oldChild[DOM_STASH2][3] = child[DOM_STASH2][3];
              if (!oldChild.f && ((oldChild.o || oldChild) === child.o || oldChild.tag[DOM_MEMO2]?.(pP, oldChild.props)) && isSameContext2(oldContexts, oldChild[DOM_STASH2][2])) {
                oldChild.s = true;
              }
            }
            child = oldChild;
          }
        } else if (!isNodeString2(child) && nameSpaceContext22) {
          const ns = useContext2(nameSpaceContext22);
          if (ns) {
            child.n = ns;
          }
        }
        if (!isNodeString2(child) && !child.s) {
          build2(context, child);
          delete child.f;
        }
        vChildren.push(child);
        if (prevNode && !prevNode.s && !child.s) {
          for (let p = prevNode;p && !isNodeString2(p); p = p.vC?.at(-1)) {
            p.nN = child;
          }
        }
        prevNode = child;
      }
    }
    node.vR = buildWithPreviousChildren ? [...node.vC, ...oldVChildren || []] : oldVChildren || [];
    node.vC = vChildren;
    if (buildWithPreviousChildren) {
      delete node.pC;
    }
  } catch (e) {
    node.f = true;
    if (e === cancelBuild2) {
      if (foundErrorHandler) {
        return;
      } else {
        throw e;
      }
    }
    const [errorHandlerContext, errorHandler, errorHandlerNode] = node[DOM_STASH2]?.[3] || [];
    if (errorHandler) {
      const fallbackUpdateFn = () => update2([0, false, context[2]], errorHandlerNode);
      const fallbackUpdateFnArray = fallbackUpdateFnArrayMap2.get(errorHandlerNode) || [];
      fallbackUpdateFnArray.push(fallbackUpdateFn);
      fallbackUpdateFnArrayMap2.set(errorHandlerNode, fallbackUpdateFnArray);
      const fallback = errorHandler(e, () => {
        const fnArray = fallbackUpdateFnArrayMap2.get(errorHandlerNode);
        if (fnArray) {
          const i = fnArray.indexOf(fallbackUpdateFn);
          if (i !== -1) {
            fnArray.splice(i, 1);
            return fallbackUpdateFn();
          }
        }
      });
      if (fallback) {
        if (context[0] === 1) {
          context[1] = true;
        } else {
          build2(context, errorHandlerNode, [fallback]);
          if ((errorHandler.length === 1 || context !== errorHandlerContext) && errorHandlerNode.c) {
            apply2(errorHandlerNode, errorHandlerNode.c, false);
            return;
          }
        }
        throw cancelBuild2;
      }
    }
    throw e;
  } finally {
    if (foundErrorHandler) {
      context[5].pop();
    }
  }
};
var buildNode2 = (node) => {
  if (node === undefined || node === null || typeof node === "boolean") {
    return;
  } else if (typeof node === "string" || typeof node === "number") {
    return { t: node.toString(), d: true };
  } else {
    if ("vR" in node) {
      node = {
        tag: node.tag,
        props: node.props,
        key: node.key,
        f: node.f,
        type: node.tag,
        ref: node.props.ref,
        o: node.o || node
      };
    }
    if (typeof node.tag === "function") {
      node[DOM_STASH2] = [0, []];
    } else {
      const ns = nameSpaceMap2[node.tag];
      if (ns) {
        nameSpaceContext22 ||= createContext3("");
        node.props.children = [
          {
            tag: nameSpaceContext22,
            props: {
              value: node.n = `http://www.w3.org/${ns}`,
              children: node.props.children
            }
          }
        ];
      }
    }
    return node;
  }
};
var updateSync2 = (context, node) => {
  node[DOM_STASH2][2]?.forEach(([c, v]) => {
    c.values.push(v);
  });
  try {
    build2(context, node, undefined);
  } catch {
    return;
  }
  if (node.a) {
    delete node.a;
    return;
  }
  node[DOM_STASH2][2]?.forEach(([c]) => {
    c.values.pop();
  });
  if (context[0] !== 1 || !context[1]) {
    apply2(node, node.c, false);
  }
};
var updateMap2 = /* @__PURE__ */ new WeakMap;
var currentUpdateSets2 = [];
var update2 = async (context, node) => {
  context[5] ||= [];
  const existing = updateMap2.get(node);
  if (existing) {
    existing[0](undefined);
  }
  let resolve;
  const promise = new Promise((r) => resolve = r);
  updateMap2.set(node, [
    resolve,
    () => {
      if (context[2]) {
        context[2](context, node, (context2) => {
          updateSync2(context2, node);
        }).then(() => resolve(node));
      } else {
        updateSync2(context, node);
        resolve(node);
      }
    }
  ]);
  if (currentUpdateSets2.length) {
    currentUpdateSets2.at(-1).add(node);
  } else {
    await Promise.resolve();
    const latest = updateMap2.get(node);
    if (latest) {
      updateMap2.delete(node);
      latest[1]();
    }
  }
  return promise;
};
var createPortal2 = (children, container, key) => ({
  tag: HONO_PORTAL_ELEMENT2,
  props: {
    children
  },
  key,
  e: container,
  p: 1
});
var STASH_SATE2 = 0;
var STASH_EFFECT2 = 1;
var STASH_CALLBACK2 = 2;
var STASH_MEMO2 = 3;
var resolvedPromiseValueMap2 = /* @__PURE__ */ new WeakMap;
var isDepsChanged2 = (prevDeps, deps) => !prevDeps || !deps || prevDeps.length !== deps.length || deps.some((dep, i) => dep !== prevDeps[i]);
var viewTransitionState = undefined;
var documentStartViewTransition = (cb) => {
  if (document?.startViewTransition) {
    return document.startViewTransition(cb);
  } else {
    cb();
    return { finished: Promise.resolve() };
  }
};
var updateHook2 = undefined;
var viewTransitionHook = (context, node, cb) => {
  const state = [true, false];
  let lastVC = node.vC;
  return documentStartViewTransition(() => {
    if (lastVC === node.vC) {
      viewTransitionState = state;
      cb(context);
      viewTransitionState = undefined;
      lastVC = node.vC;
    }
  }).finished.then(() => {
    if (state[1] && lastVC === node.vC) {
      state[0] = false;
      viewTransitionState = state;
      cb(context);
      viewTransitionState = undefined;
    }
  });
};
var startViewTransition2 = (callback) => {
  updateHook2 = viewTransitionHook;
  try {
    callback();
  } finally {
    updateHook2 = undefined;
  }
};
var useViewTransition2 = () => {
  const buildData = buildDataStack2.at(-1);
  if (!buildData) {
    return [false, () => {}];
  }
  if (viewTransitionState) {
    viewTransitionState[1] = true;
  }
  return [!!viewTransitionState?.[0], startViewTransition2];
};
var pendingStack2 = [];
var useState2 = (initialState) => {
  const resolveInitialState = () => typeof initialState === "function" ? initialState() : initialState;
  const buildData = buildDataStack2.at(-1);
  if (!buildData) {
    return [resolveInitialState(), () => {}];
  }
  const [, node] = buildData;
  const stateArray = node[DOM_STASH2][1][STASH_SATE2] ||= [];
  const hookIndex = node[DOM_STASH2][0]++;
  return stateArray[hookIndex] ||= [
    resolveInitialState(),
    (newState) => {
      const localUpdateHook = updateHook2;
      const stateData = stateArray[hookIndex];
      if (typeof newState === "function") {
        newState = newState(stateData[0]);
      }
      if (!Object.is(newState, stateData[0])) {
        stateData[0] = newState;
        if (pendingStack2.length) {
          const [pendingType, pendingPromise] = pendingStack2.at(-1);
          Promise.all([
            pendingType === 3 ? node : update2([pendingType, false, localUpdateHook], node),
            pendingPromise
          ]).then(([node2]) => {
            if (!node2 || !(pendingType === 2 || pendingType === 3)) {
              return;
            }
            const lastVC = node2.vC;
            const addUpdateTask = () => {
              setTimeout(() => {
                if (lastVC !== node2.vC) {
                  return;
                }
                update2([pendingType === 3 ? 1 : 0, false, localUpdateHook], node2);
              });
            };
            requestAnimationFrame(addUpdateTask);
          });
        } else {
          update2([0, false, localUpdateHook], node);
        }
      }
    }
  ];
};
var useEffectCommon = (index, effect, deps) => {
  const buildData = buildDataStack2.at(-1);
  if (!buildData) {
    return;
  }
  const [, node] = buildData;
  const effectDepsArray = node[DOM_STASH2][1][STASH_EFFECT2] ||= [];
  const hookIndex = node[DOM_STASH2][0]++;
  const [prevDeps, , prevCleanup] = effectDepsArray[hookIndex] ||= [];
  if (isDepsChanged2(prevDeps, deps)) {
    if (prevCleanup) {
      prevCleanup();
    }
    const runner = () => {
      data[index] = undefined;
      data[2] = effect();
    };
    const data = [deps, undefined, undefined, undefined, undefined];
    data[index] = runner;
    effectDepsArray[hookIndex] = data;
  }
};
var useEffect2 = (effect, deps) => useEffectCommon(3, effect, deps);
var useCallback2 = (callback, deps) => {
  const buildData = buildDataStack2.at(-1);
  if (!buildData) {
    return callback;
  }
  const [, node] = buildData;
  const callbackArray = node[DOM_STASH2][1][STASH_CALLBACK2] ||= [];
  const hookIndex = node[DOM_STASH2][0]++;
  const prevDeps = callbackArray[hookIndex];
  if (isDepsChanged2(prevDeps?.[1], deps)) {
    callbackArray[hookIndex] = [callback, deps];
  } else {
    callback = callbackArray[hookIndex][0];
  }
  return callback;
};
var use2 = (promise) => {
  const cachedRes = resolvedPromiseValueMap2.get(promise);
  if (cachedRes) {
    if (cachedRes.length === 2) {
      throw cachedRes[1];
    }
    return cachedRes[0];
  }
  promise.then((res) => resolvedPromiseValueMap2.set(promise, [res]), (e) => resolvedPromiseValueMap2.set(promise, [undefined, e]));
  throw promise;
};
var useMemo2 = (factory, deps) => {
  const buildData = buildDataStack2.at(-1);
  if (!buildData) {
    return factory();
  }
  const [, node] = buildData;
  const memoArray = node[DOM_STASH2][1][STASH_MEMO2] ||= [];
  const hookIndex = node[DOM_STASH2][0]++;
  const prevDeps = memoArray[hookIndex];
  if (isDepsChanged2(prevDeps?.[1], deps)) {
    memoArray[hookIndex] = [factory(), deps];
  }
  return memoArray[hookIndex][0];
};
var FormContext2 = createContext3({
  pending: false,
  data: null,
  method: null,
  action: null
});
var actions2 = /* @__PURE__ */ new Set;
var registerAction2 = (action) => {
  actions2.add(action);
  action.finally(() => actions2.delete(action));
};
var clearCache2 = () => {
  blockingPromiseMap2 = /* @__PURE__ */ Object.create(null);
  createdElements2 = /* @__PURE__ */ Object.create(null);
};
var composeRef2 = (ref, cb) => {
  return useMemo2(() => (e) => {
    let refCleanup;
    if (ref) {
      if (typeof ref === "function") {
        refCleanup = ref(e) || (() => {
          ref(null);
        });
      } else if (ref && "current" in ref) {
        ref.current = e;
        refCleanup = () => {
          ref.current = null;
        };
      }
    }
    const cbCleanup = cb(e);
    return () => {
      cbCleanup?.();
      refCleanup?.();
    };
  }, [ref]);
};
var blockingPromiseMap2 = /* @__PURE__ */ Object.create(null);
var createdElements2 = /* @__PURE__ */ Object.create(null);
var documentMetadataTag2 = (tag, props, preserveNodeType, supportSort, supportBlocking) => {
  if (props?.itemProp) {
    return {
      tag,
      props,
      type: tag,
      ref: props.ref
    };
  }
  const head = document.head;
  let { onLoad, onError, precedence, blocking, ...restProps } = props;
  let element = null;
  let created = false;
  const deDupeKeys = deDupeKeyMap2[tag];
  let existingElements = undefined;
  if (deDupeKeys.length > 0) {
    const tags = head.querySelectorAll(tag);
    LOOP:
      for (const e of tags) {
        for (const key of deDupeKeyMap2[tag]) {
          if (e.getAttribute(key) === props[key]) {
            element = e;
            break LOOP;
          }
        }
      }
    if (!element) {
      const cacheKey = deDupeKeys.reduce((acc, key) => props[key] === undefined ? acc : `${acc}-${key}-${props[key]}`, tag);
      created = !createdElements2[cacheKey];
      element = createdElements2[cacheKey] ||= (() => {
        const e = document.createElement(tag);
        for (const key of deDupeKeys) {
          if (props[key] !== undefined) {
            e.setAttribute(key, props[key]);
          }
          if (props.rel) {
            e.setAttribute("rel", props.rel);
          }
        }
        return e;
      })();
    }
  } else {
    existingElements = head.querySelectorAll(tag);
  }
  precedence = supportSort ? precedence ?? "" : undefined;
  if (supportSort) {
    restProps[dataPrecedenceAttr2] = precedence;
  }
  const insert = useCallback2((e) => {
    if (deDupeKeys.length > 0) {
      let found = false;
      for (const existingElement of head.querySelectorAll(tag)) {
        if (found && existingElement.getAttribute(dataPrecedenceAttr2) !== precedence) {
          head.insertBefore(e, existingElement);
          return;
        }
        if (existingElement.getAttribute(dataPrecedenceAttr2) === precedence) {
          found = true;
        }
      }
      head.appendChild(e);
    } else if (existingElements) {
      let found = false;
      for (const existingElement of existingElements) {
        if (existingElement === e) {
          found = true;
          break;
        }
      }
      if (!found) {
        head.insertBefore(e, head.contains(existingElements[0]) ? existingElements[0] : head.querySelector(tag));
      }
      existingElements = undefined;
    }
  }, [precedence]);
  const ref = composeRef2(props.ref, (e) => {
    const key = deDupeKeys[0];
    if (preserveNodeType === 2) {
      e.innerHTML = "";
    }
    if (created || existingElements) {
      insert(e);
    }
    if (!onError && !onLoad) {
      return;
    }
    let promise = blockingPromiseMap2[e.getAttribute(key)] ||= new Promise((resolve, reject) => {
      e.addEventListener("load", resolve);
      e.addEventListener("error", reject);
    });
    if (onLoad) {
      promise = promise.then(onLoad);
    }
    if (onError) {
      promise = promise.catch(onError);
    }
    promise.catch(() => {});
  });
  if (supportBlocking && blocking === "render") {
    const key = deDupeKeyMap2[tag][0];
    if (props[key]) {
      const value = props[key];
      const promise = blockingPromiseMap2[value] ||= new Promise((resolve, reject) => {
        insert(element);
        element.addEventListener("load", resolve);
        element.addEventListener("error", reject);
      });
      use2(promise);
    }
  }
  const jsxNode = {
    tag,
    type: tag,
    props: {
      ...restProps,
      ref
    },
    ref
  };
  jsxNode.p = preserveNodeType;
  if (element) {
    jsxNode.e = element;
  }
  return createPortal2(jsxNode, head);
};
var title2 = (props) => {
  const nameSpaceContext3 = getNameSpaceContext22();
  const ns = nameSpaceContext3 && useContext2(nameSpaceContext3);
  if (ns?.endsWith("svg")) {
    return {
      tag: "title",
      props,
      type: "title",
      ref: props.ref
    };
  }
  return documentMetadataTag2("title", props, undefined, false, false);
};
var script2 = (props) => {
  if (!props || ["src", "async"].some((k) => !props[k])) {
    return {
      tag: "script",
      props,
      type: "script",
      ref: props.ref
    };
  }
  return documentMetadataTag2("script", props, 1, false, true);
};
var style2 = (props) => {
  if (!props || !["href", "precedence"].every((k) => (k in props))) {
    return {
      tag: "style",
      props,
      type: "style",
      ref: props.ref
    };
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag2("style", props, 2, true, true);
};
var link2 = (props) => {
  if (!props || ["onLoad", "onError"].some((k) => (k in props)) || props.rel === "stylesheet" && (!("precedence" in props) || ("disabled" in props))) {
    return {
      tag: "link",
      props,
      type: "link",
      ref: props.ref
    };
  }
  return documentMetadataTag2("link", props, 1, "precedence" in props, true);
};
var meta2 = (props) => {
  return documentMetadataTag2("meta", props, undefined, false, false);
};
var customEventFormAction2 = /* @__PURE__ */ Symbol();
var form2 = (props) => {
  const { action, ...restProps } = props;
  if (typeof action !== "function") {
    restProps.action = action;
  }
  const [state, setState] = useState2([null, false]);
  const onSubmit = useCallback2(async (ev) => {
    const currentAction = ev.isTrusted ? action : ev.detail[customEventFormAction2];
    if (typeof currentAction !== "function") {
      return;
    }
    ev.preventDefault();
    const formData = new FormData(ev.target);
    setState([formData, true]);
    const actionRes = currentAction(formData);
    if (actionRes instanceof Promise) {
      registerAction2(actionRes);
      await actionRes;
    }
    setState([null, true]);
  }, []);
  const ref = composeRef2(props.ref, (el) => {
    el.addEventListener("submit", onSubmit);
    return () => {
      el.removeEventListener("submit", onSubmit);
    };
  });
  const [data, isDirty] = state;
  state[1] = false;
  return {
    tag: FormContext2,
    props: {
      value: {
        pending: data !== null,
        data,
        method: data ? "post" : null,
        action: data ? action : null
      },
      children: {
        tag: "form",
        props: {
          ...restProps,
          ref
        },
        type: "form",
        ref
      }
    },
    f: isDirty
  };
};
var formActionableElement2 = (tag, {
  formAction,
  ...props
}) => {
  if (typeof formAction === "function") {
    const onClick = useCallback2((ev) => {
      ev.preventDefault();
      ev.currentTarget.form.dispatchEvent(new CustomEvent("submit", { detail: { [customEventFormAction2]: formAction } }));
    }, []);
    props.ref = composeRef2(props.ref, (el) => {
      el.addEventListener("click", onClick);
      return () => {
        el.removeEventListener("click", onClick);
      };
    });
  }
  return {
    tag,
    props,
    type: tag,
    ref: props.ref
  };
};
var input2 = (props) => formActionableElement2("input", props);
var button2 = (props) => formActionableElement2("button", props);
Object.assign(domRenderers2, {
  title: title2,
  script: script2,
  style: style2,
  link: link2,
  meta: meta2,
  form: form2,
  input: input2,
  button: button2
});
var jsxDEV2 = (tag, props, key) => {
  if (typeof tag === "string" && exports_components22[tag]) {
    tag = exports_components22[tag];
  }
  return {
    tag,
    type: tag,
    props,
    key,
    ref: props.ref
  };
};
var Fragment2 = (props) => jsxDEV2("", props, undefined);
var ErrorBoundary2 = ({ children, fallback, fallbackRender, onError }) => {
  const res = Fragment2({ children });
  res[DOM_ERROR_HANDLER2] = (err) => {
    if (err instanceof Promise) {
      throw err;
    }
    onError?.(err);
    return fallbackRender?.(err) || fallback;
  };
  return res;
};
var Suspense2 = ({
  children,
  fallback
}) => {
  const res = Fragment2({ children });
  res[DOM_ERROR_HANDLER2] = (err, retry) => {
    if (!(err instanceof Promise)) {
      throw err;
    }
    err.finally(retry);
    return fallback;
  };
  return res;
};
var StreamingContext = createContext22(null);
var suspenseCounter = 0;
var Suspense22 = async ({
  children,
  fallback
}) => {
  if (!Array.isArray(children)) {
    children = [children];
  }
  const nonce = useContext2(StreamingContext)?.scriptNonce;
  let resArray = [];
  const stackNode = { [DOM_STASH2]: [0, []] };
  const popNodeStack = (value) => {
    buildDataStack2.pop();
    return value;
  };
  try {
    stackNode[DOM_STASH2][0] = 0;
    buildDataStack2.push([[], stackNode]);
    resArray = children.map((c) => c == null || typeof c === "boolean" ? "" : c.toString());
  } catch (e) {
    if (e instanceof Promise) {
      resArray = [
        e.then(() => {
          stackNode[DOM_STASH2][0] = 0;
          buildDataStack2.push([[], stackNode]);
          return childrenToString(children).then(popNodeStack);
        })
      ];
    } else {
      throw e;
    }
  } finally {
    popNodeStack();
  }
  if (resArray.some((res) => res instanceof Promise)) {
    const index = suspenseCounter++;
    const fallbackStr = await fallback.toString();
    return raw2(`<template id="H:${index}"></template>${fallbackStr}<!--/$-->`, [
      ...fallbackStr.callbacks || [],
      ({ phase, buffer, context }) => {
        if (phase === HtmlEscapedCallbackPhase.BeforeStream) {
          return;
        }
        return Promise.all(resArray).then(async (htmlArray) => {
          htmlArray = htmlArray.flat();
          const content = htmlArray.join("");
          if (buffer) {
            buffer[0] = buffer[0].replace(new RegExp(`<template id="H:${index}"></template>.*?<!--/\\$-->`), content);
          }
          let html = buffer ? "" : `<template data-hono-target="H:${index}">${content}</template><script${nonce ? ` nonce="${nonce}"` : ""}>
((d,c,n) => {
c=d.currentScript.previousSibling
d=d.getElementById('H:${index}')
if(!d)return
do{n=d.nextSibling;n.remove()}while(n.nodeType!=8||n.nodeValue!='/$')
d.replaceWith(c.content)
})(document)
</script>`;
          const callbacks = htmlArray.map((html2) => html2.callbacks || []).flat();
          if (!callbacks.length) {
            return html;
          }
          if (phase === HtmlEscapedCallbackPhase.Stream) {
            html = await resolveCallback(html, HtmlEscapedCallbackPhase.BeforeStream, true, context);
          }
          return raw2(html, callbacks);
        });
      }
    ]);
  } else {
    return raw2(resArray.join(""));
  }
};
Suspense22[DOM_RENDERER2] = Suspense2;
var textEncoder = new TextEncoder;
var errorBoundaryCounter = 0;
var childrenToString = async (children) => {
  try {
    return children.flat().map((c) => c == null || typeof c === "boolean" ? "" : c.toString());
  } catch (e) {
    if (e instanceof Promise) {
      await e;
      return childrenToString(children);
    } else {
      throw e;
    }
  }
};
var ErrorBoundary22 = async ({ children, fallback, fallbackRender, onError }) => {
  if (!children) {
    return raw2("");
  }
  if (!Array.isArray(children)) {
    children = [children];
  }
  const nonce = useContext2(StreamingContext)?.scriptNonce;
  let fallbackStr;
  const fallbackRes = (error) => {
    onError?.(error);
    return (fallbackStr || fallbackRender?.(error) || "").toString();
  };
  let resArray = [];
  try {
    resArray = children.map((c) => c == null || typeof c === "boolean" ? "" : c.toString());
  } catch (e) {
    fallbackStr = await fallback?.toString();
    if (e instanceof Promise) {
      resArray = [
        e.then(() => childrenToString(children)).catch((e2) => fallbackRes(e2))
      ];
    } else {
      resArray = [fallbackRes(e)];
    }
  }
  if (resArray.some((res) => res instanceof Promise)) {
    fallbackStr ||= await fallback?.toString();
    const index = errorBoundaryCounter++;
    const replaceRe = RegExp(`(<template id="E:${index}"></template>.*?)(.*?)(<!--E:${index}-->)`);
    const caught = false;
    const catchCallback = ({ error: error2, buffer }) => {
      if (caught) {
        return "";
      }
      const fallbackResString = fallbackRes(error2);
      if (buffer) {
        buffer[0] = buffer[0].replace(replaceRe, fallbackResString);
      }
      return buffer ? "" : `<template data-hono-target="E:${index}">${fallbackResString}</template><script>
((d,c,n) => {
c=d.currentScript.previousSibling
d=d.getElementById('E:${index}')
if(!d)return
do{n=d.nextSibling;n.remove()}while(n.nodeType!=8||n.nodeValue!='E:${index}')
d.replaceWith(c.content)
})(document)
</script>`;
    };
    let error;
    const promiseAll = Promise.all(resArray).catch((e) => error = e);
    return raw2(`<template id="E:${index}"></template><!--E:${index}-->`, [
      ({ phase, buffer, context }) => {
        if (phase === HtmlEscapedCallbackPhase.BeforeStream) {
          return;
        }
        return promiseAll.then(async (htmlArray) => {
          if (error) {
            throw error;
          }
          htmlArray = htmlArray.flat();
          const content = htmlArray.join("");
          let html = buffer ? "" : `<template data-hono-target="E:${index}">${content}</template><script${nonce ? ` nonce="${nonce}"` : ""}>
((d,c) => {
c=d.currentScript.previousSibling
d=d.getElementById('E:${index}')
if(!d)return
d.parentElement.insertBefore(c.content,d.nextSibling)
})(document)
</script>`;
          if (htmlArray.every((html2) => !html2.callbacks?.length)) {
            if (buffer) {
              buffer[0] = buffer[0].replace(replaceRe, content);
            }
            return html;
          }
          if (buffer) {
            buffer[0] = buffer[0].replace(replaceRe, (_all, pre, _, post) => `${pre}${content}${post}`);
          }
          const callbacks = htmlArray.map((html2) => html2.callbacks || []).flat();
          if (phase === HtmlEscapedCallbackPhase.Stream) {
            html = await resolveCallback(html, HtmlEscapedCallbackPhase.BeforeStream, true, context);
          }
          let resolvedCount = 0;
          const promises = callbacks.map((c) => (...args) => c(...args)?.then((content2) => {
            resolvedCount++;
            if (buffer) {
              if (resolvedCount === callbacks.length) {
                buffer[0] = buffer[0].replace(replaceRe, (_all, _pre, content3) => content3);
              }
              buffer[0] += content2;
              return raw2("", content2.callbacks);
            }
            return raw2(content2 + (resolvedCount !== callbacks.length ? "" : `<script>
((d,c,n) => {
d=d.getElementById('E:${index}')
if(!d)return
n=d.nextSibling
while(n.nodeType!=8||n.nodeValue!='E:${index}'){n=n.nextSibling}
n.remove()
d.remove()
})(document)
</script>`), content2.callbacks);
          }).catch((error2) => catchCallback({ error: error2, buffer })));
          return raw2(html, promises);
        }).catch((error2) => catchCallback({ error: error2, buffer }));
      }
    ]);
  } else {
    return raw2(resArray.join(""));
  }
};
ErrorBoundary22[DOM_RENDERER2] = ErrorBoundary2;
var PSEUDO_GLOBAL_SELECTOR = ":-hono-global";
var isPseudoGlobalSelectorRe = new RegExp(`^${PSEUDO_GLOBAL_SELECTOR}{(.*)}$`);
var DEFAULT_STYLE_ID = "hono-css";
var SELECTOR = /* @__PURE__ */ Symbol();
var CLASS_NAME = /* @__PURE__ */ Symbol();
var STYLE_STRING = /* @__PURE__ */ Symbol();
var SELECTORS = /* @__PURE__ */ Symbol();
var EXTERNAL_CLASS_NAMES = /* @__PURE__ */ Symbol();
var CSS_ESCAPED = /* @__PURE__ */ Symbol();
var toHash = (str) => {
  let i = 0, out = 11;
  while (i < str.length) {
    out = 101 * out + str.charCodeAt(i++) >>> 0;
  }
  return "css-" + out;
};
var cssStringReStr = [
  '"(?:(?:\\\\[\\s\\S]|[^"\\\\])*)"',
  "'(?:(?:\\\\[\\s\\S]|[^'\\\\])*)'"
].join("|");
var minifyCssRe = new RegExp([
  "(" + cssStringReStr + ")",
  "(?:" + [
    "^\\s+",
    "\\/\\*.*?\\*\\/\\s*",
    "\\/\\/.*\\n\\s*",
    "\\s+$"
  ].join("|") + ")",
  "\\s*;\\s*(}|$)\\s*",
  "\\s*([{};:,])\\s*",
  "(\\s)\\s+"
].join("|"), "g");
var minify = (css) => {
  return css.replace(minifyCssRe, (_, $1, $2, $3, $4) => $1 || $2 || $3 || $4 || "");
};
var buildStyleString = (strings, values) => {
  const selectors = [];
  const externalClassNames = [];
  const label = strings[0].match(/^\s*\/\*(.*?)\*\//)?.[1] || "";
  let styleString = "";
  for (let i = 0, len = strings.length;i < len; i++) {
    styleString += strings[i];
    let vArray = values[i];
    if (typeof vArray === "boolean" || vArray === null || vArray === undefined) {
      continue;
    }
    if (!Array.isArray(vArray)) {
      vArray = [vArray];
    }
    for (let j = 0, len2 = vArray.length;j < len2; j++) {
      let value = vArray[j];
      if (typeof value === "boolean" || value === null || value === undefined) {
        continue;
      }
      if (typeof value === "string") {
        if (/([\\"'\/])/.test(value)) {
          styleString += value.replace(/([\\"']|(?<=<)\/)/g, "\\$1");
        } else {
          styleString += value;
        }
      } else if (typeof value === "number") {
        styleString += value;
      } else if (value[CSS_ESCAPED]) {
        styleString += value[CSS_ESCAPED];
      } else if (value[CLASS_NAME].startsWith("@keyframes ")) {
        selectors.push(value);
        styleString += ` ${value[CLASS_NAME].substring(11)} `;
      } else {
        if (strings[i + 1]?.match(/^\s*{/)) {
          selectors.push(value);
          value = `.${value[CLASS_NAME]}`;
        } else {
          selectors.push(...value[SELECTORS]);
          externalClassNames.push(...value[EXTERNAL_CLASS_NAMES]);
          value = value[STYLE_STRING];
          const valueLen = value.length;
          if (valueLen > 0) {
            const lastChar = value[valueLen - 1];
            if (lastChar !== ";" && lastChar !== "}") {
              value += ";";
            }
          }
        }
        styleString += `${value || ""}`;
      }
    }
  }
  return [label, minify(styleString), selectors, externalClassNames];
};
var cssCommon = (strings, values) => {
  let [label, thisStyleString, selectors, externalClassNames] = buildStyleString(strings, values);
  const isPseudoGlobal = isPseudoGlobalSelectorRe.exec(thisStyleString);
  if (isPseudoGlobal) {
    thisStyleString = isPseudoGlobal[1];
  }
  const selector = (isPseudoGlobal ? PSEUDO_GLOBAL_SELECTOR : "") + toHash(label + thisStyleString);
  const className = (isPseudoGlobal ? selectors.map((s) => s[CLASS_NAME]) : [selector, ...externalClassNames]).join(" ");
  return {
    [SELECTOR]: selector,
    [CLASS_NAME]: className,
    [STYLE_STRING]: thisStyleString,
    [SELECTORS]: selectors,
    [EXTERNAL_CLASS_NAMES]: externalClassNames
  };
};
var cxCommon = (args) => {
  for (let i = 0, len = args.length;i < len; i++) {
    const arg = args[i];
    if (typeof arg === "string") {
      args[i] = {
        [SELECTOR]: "",
        [CLASS_NAME]: "",
        [STYLE_STRING]: "",
        [SELECTORS]: [],
        [EXTERNAL_CLASS_NAMES]: [arg]
      };
    }
  }
  return args;
};
var keyframesCommon = (strings, ...values) => {
  const [label, styleString] = buildStyleString(strings, values);
  return {
    [SELECTOR]: "",
    [CLASS_NAME]: `@keyframes ${toHash(label + styleString)}`,
    [STYLE_STRING]: styleString,
    [SELECTORS]: [],
    [EXTERNAL_CLASS_NAMES]: []
  };
};
var viewTransitionNameIndex = 0;
var viewTransitionCommon = (strings, values) => {
  if (!strings) {
    strings = [`/* h-v-t ${viewTransitionNameIndex++} */`];
  }
  const content = Array.isArray(strings) ? cssCommon(strings, values) : strings;
  const transitionName = content[CLASS_NAME];
  const res = cssCommon(["view-transition-name:", ""], [transitionName]);
  content[CLASS_NAME] = PSEUDO_GLOBAL_SELECTOR + content[CLASS_NAME];
  content[STYLE_STRING] = content[STYLE_STRING].replace(/(?<=::view-transition(?:[a-z-]*)\()(?=\))/g, transitionName);
  res[CLASS_NAME] = res[SELECTOR] = transitionName;
  res[SELECTORS] = [...content[SELECTORS], content];
  return res;
};
var splitRule = (rule) => {
  const result = [];
  let startPos = 0;
  let depth = 0;
  for (let i = 0, len = rule.length;i < len; i++) {
    const char = rule[i];
    if (char === "'" || char === '"') {
      const quote = char;
      i++;
      for (;i < len; i++) {
        if (rule[i] === "\\") {
          i++;
          continue;
        }
        if (rule[i] === quote) {
          break;
        }
      }
      continue;
    }
    if (char === "{") {
      depth++;
      continue;
    }
    if (char === "}") {
      depth--;
      if (depth === 0) {
        result.push(rule.slice(startPos, i + 1));
        startPos = i + 1;
      }
      continue;
    }
  }
  return result;
};
var createCssJsxDomObjects = ({ id }) => {
  let styleSheet = undefined;
  const findStyleSheet = () => {
    if (!styleSheet) {
      styleSheet = document.querySelector(`style#${id}`)?.sheet;
      if (styleSheet) {
        styleSheet.addedStyles = /* @__PURE__ */ new Set;
      }
    }
    return styleSheet ? [styleSheet, styleSheet.addedStyles] : [];
  };
  const insertRule = (className, styleString) => {
    const [sheet, addedStyles] = findStyleSheet();
    if (!sheet || !addedStyles) {
      Promise.resolve().then(() => {
        if (!findStyleSheet()[0]) {
          throw new Error("style sheet not found");
        }
        insertRule(className, styleString);
      });
      return;
    }
    if (!addedStyles.has(className)) {
      addedStyles.add(className);
      (className.startsWith(PSEUDO_GLOBAL_SELECTOR) ? splitRule(styleString) : [`${className[0] === "@" ? "" : "."}${className}{${styleString}}`]).forEach((rule) => {
        sheet.insertRule(rule, sheet.cssRules.length);
      });
    }
  };
  const cssObject = {
    toString() {
      const selector = this[SELECTOR];
      insertRule(selector, this[STYLE_STRING]);
      this[SELECTORS].forEach(({ [CLASS_NAME]: className, [STYLE_STRING]: styleString }) => {
        insertRule(className, styleString);
      });
      return this[CLASS_NAME];
    }
  };
  const Style2 = ({ children, nonce }) => ({
    tag: "style",
    props: {
      id,
      nonce,
      children: children && (Array.isArray(children) ? children : [children]).map((c) => c[STYLE_STRING])
    }
  });
  return [cssObject, Style2];
};
var createCssContext = ({ id }) => {
  const [cssObject, Style2] = createCssJsxDomObjects({ id });
  const newCssClassNameObject = (cssClassName) => {
    cssClassName.toString = cssObject.toString;
    return cssClassName;
  };
  const css2 = (strings, ...values) => {
    return newCssClassNameObject(cssCommon(strings, values));
  };
  const cx2 = (...args) => {
    args = cxCommon(args);
    return css2(Array(args.length).fill(""), ...args);
  };
  const keyframes2 = keyframesCommon;
  const viewTransition2 = (strings, ...values) => {
    return newCssClassNameObject(viewTransitionCommon(strings, values));
  };
  return {
    css: css2,
    cx: cx2,
    keyframes: keyframes2,
    viewTransition: viewTransition2,
    Style: Style2
  };
};
var defaultContext = createCssContext({ id: DEFAULT_STYLE_ID });
var css = defaultContext.css;
var cx = defaultContext.cx;
var keyframes = defaultContext.keyframes;
var viewTransition = defaultContext.viewTransition;
var Style = defaultContext.Style;
var createCssContext2 = ({ id }) => {
  const [cssJsxDomObject, StyleRenderToDom] = createCssJsxDomObjects({ id });
  const contextMap = /* @__PURE__ */ new WeakMap;
  const nonceMap = /* @__PURE__ */ new WeakMap;
  const replaceStyleRe = new RegExp(`(<style id="${id}"(?: nonce="[^"]*")?>.*?)(</style>)`);
  const newCssClassNameObject = (cssClassName) => {
    const appendStyle = ({ buffer, context }) => {
      const [toAdd, added] = contextMap.get(context);
      const names = Object.keys(toAdd);
      if (!names.length) {
        return;
      }
      let stylesStr = "";
      names.forEach((className2) => {
        added[className2] = true;
        stylesStr += className2.startsWith(PSEUDO_GLOBAL_SELECTOR) ? toAdd[className2] : `${className2[0] === "@" ? "" : "."}${className2}{${toAdd[className2]}}`;
      });
      contextMap.set(context, [{}, added]);
      if (buffer && replaceStyleRe.test(buffer[0])) {
        buffer[0] = buffer[0].replace(replaceStyleRe, (_, pre, post) => `${pre}${stylesStr}${post}`);
        return;
      }
      const nonce = nonceMap.get(context);
      const appendStyleScript = `<script${nonce ? ` nonce="${nonce}"` : ""}>document.querySelector('#${id}').textContent+=${JSON.stringify(stylesStr)}</script>`;
      if (buffer) {
        buffer[0] = `${appendStyleScript}${buffer[0]}`;
        return;
      }
      return Promise.resolve(appendStyleScript);
    };
    const addClassNameToContext = ({ context }) => {
      if (!contextMap.has(context)) {
        contextMap.set(context, [{}, {}]);
      }
      const [toAdd, added] = contextMap.get(context);
      let allAdded = true;
      if (!added[cssClassName[SELECTOR]]) {
        allAdded = false;
        toAdd[cssClassName[SELECTOR]] = cssClassName[STYLE_STRING];
      }
      cssClassName[SELECTORS].forEach(({ [CLASS_NAME]: className2, [STYLE_STRING]: styleString }) => {
        if (!added[className2]) {
          allAdded = false;
          toAdd[className2] = styleString;
        }
      });
      if (allAdded) {
        return;
      }
      return Promise.resolve(raw2("", [appendStyle]));
    };
    const className = new String(cssClassName[CLASS_NAME]);
    Object.assign(className, cssClassName);
    className.isEscaped = true;
    className.callbacks = [addClassNameToContext];
    const promise = Promise.resolve(className);
    Object.assign(promise, cssClassName);
    promise.toString = cssJsxDomObject.toString;
    return promise;
  };
  const css2 = (strings, ...values) => {
    return newCssClassNameObject(cssCommon(strings, values));
  };
  const cx2 = (...args) => {
    args = cxCommon(args);
    return css2(Array(args.length).fill(""), ...args);
  };
  const keyframes2 = keyframesCommon;
  const viewTransition2 = (strings, ...values) => {
    return newCssClassNameObject(viewTransitionCommon(strings, values));
  };
  const Style2 = ({ children, nonce } = {}) => raw2(`<style id="${id}"${nonce ? ` nonce="${nonce}"` : ""}>${children ? children[STYLE_STRING] : ""}</style>`, [
    ({ context }) => {
      nonceMap.set(context, nonce);
      return;
    }
  ]);
  Style2[DOM_RENDERER2] = StyleRenderToDom;
  return {
    css: css2,
    cx: cx2,
    keyframes: keyframes2,
    viewTransition: viewTransition2,
    Style: Style2
  };
};
var defaultContext2 = createCssContext2({
  id: DEFAULT_STYLE_ID
});
var css2 = defaultContext2.css;
var cx2 = defaultContext2.cx;
var keyframes2 = defaultContext2.keyframes;
var viewTransition2 = defaultContext2.viewTransition;
var Style2 = defaultContext2.Style;
function QRCodeGenerator() {
  const [form22, setForm] = useState2({
    content: "https://hono.dev",
    cellSize: 10,
    margin: 4,
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    errorCorrectionLevel: "M",
    logo: {
      enabled: false,
      path: "",
      sizePercentage: 0.2,
      gapPercentage: 0.25
    },
    dataDotShape: "square",
    cornerMarkerShape: "square"
  });
  const [qrCodeUrl, setQrCodeUrl] = useState2("");
  const [isLoading, setIsLoading] = useState2(false);
  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateLogo = (field, value) => {
    setForm((prev) => ({
      ...prev,
      logo: { ...prev.logo, [field]: value }
    }));
  };
  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form22)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrCodeUrl(url);
      } else {
        console.error("Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect2(() => {
    generateQRCode();
  }, []);
  const formStyle = css2`
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  `;
  const inputStyle = css2`
    width: 100%;
    padding: 8px;
    margin: 5px 0 15px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  `;
  const buttonStyle = css2`
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;
    
    &:hover {
      background-color: #0056b3;
    }
    
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `;
  const previewStyle = css2`
    text-align: center;
    margin: 20px 0;
    
    img {
      max-width: 300px;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      background-color: white;
    }
  `;
  const sectionStyle = css2`
    margin-bottom: 25px;
    
    h3 {
      margin-bottom: 10px;
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 5px;
    }
  `;
  return /* @__PURE__ */ jsxDEV2(Fragment2, {
    children: [
      /* @__PURE__ */ jsxDEV2(Style2, {}, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        class: formStyle,
        children: [
          /* @__PURE__ */ jsxDEV2("h1", {
            children: "QR Code Generator"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            class: sectionStyle,
            children: [
              /* @__PURE__ */ jsxDEV2("h3", {
                children: "Basic Settings"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Content:",
                  /* @__PURE__ */ jsxDEV2("input", {
                    type: "text",
                    class: inputStyle,
                    value: form22.content,
                    onInput: (e) => updateForm("content", e.target.value),
                    placeholder: "Enter text or URL"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Cell Size:",
                  /* @__PURE__ */ jsxDEV2("input", {
                    type: "number",
                    class: inputStyle,
                    value: form22.cellSize,
                    min: "1",
                    max: "50",
                    onInput: (e) => updateForm("cellSize", parseInt(e.target.value))
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Margin:",
                  /* @__PURE__ */ jsxDEV2("input", {
                    type: "number",
                    class: inputStyle,
                    value: form22.margin,
                    min: "0",
                    max: "20",
                    onInput: (e) => updateForm("margin", parseInt(e.target.value))
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            class: sectionStyle,
            children: [
              /* @__PURE__ */ jsxDEV2("h3", {
                children: "Colors"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Foreground Color:",
                  /* @__PURE__ */ jsxDEV2("input", {
                    type: "color",
                    class: inputStyle,
                    value: form22.foregroundColor,
                    onInput: (e) => updateForm("foregroundColor", e.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Background Color:",
                  /* @__PURE__ */ jsxDEV2("input", {
                    type: "color",
                    class: inputStyle,
                    value: form22.backgroundColor,
                    onInput: (e) => updateForm("backgroundColor", e.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            class: sectionStyle,
            children: [
              /* @__PURE__ */ jsxDEV2("h3", {
                children: "Shapes"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Data Dot Shape:",
                  /* @__PURE__ */ jsxDEV2("select", {
                    class: inputStyle,
                    value: form22.dataDotShape,
                    onChange: (e) => updateForm("dataDotShape", e.target.value),
                    children: [
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "square",
                        children: "Square"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "circle",
                        children: "Circle"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "diamond",
                        children: "Diamond"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "rounded",
                        children: "Rounded"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Corner Marker Shape:",
                  /* @__PURE__ */ jsxDEV2("select", {
                    class: inputStyle,
                    value: form22.cornerMarkerShape,
                    onChange: (e) => updateForm("cornerMarkerShape", e.target.value),
                    children: [
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "square",
                        children: "Square"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "rounded",
                        children: "Rounded"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "circle",
                        children: "Circle"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            class: sectionStyle,
            children: [
              /* @__PURE__ */ jsxDEV2("h3", {
                children: "Error Correction"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  "Error Correction Level:",
                  /* @__PURE__ */ jsxDEV2("select", {
                    class: inputStyle,
                    value: form22.errorCorrectionLevel,
                    onChange: (e) => updateForm("errorCorrectionLevel", e.target.value),
                    children: [
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "L",
                        children: "Low (7%)"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "M",
                        children: "Medium (15%)"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "Q",
                        children: "Quartile (25%)"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("option", {
                        value: "H",
                        children: "High (30%)"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            class: sectionStyle,
            children: [
              /* @__PURE__ */ jsxDEV2("h3", {
                children: "Logo Settings"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("label", {
                children: [
                  /* @__PURE__ */ jsxDEV2("input", {
                    type: "checkbox",
                    checked: form22.logo.enabled,
                    onChange: (e) => updateLogo("enabled", e.target.checked)
                  }, undefined, false, undefined, this),
                  "Enable Logo"
                ]
              }, undefined, true, undefined, this),
              form22.logo.enabled && /* @__PURE__ */ jsxDEV2(Fragment2, {
                children: [
                  /* @__PURE__ */ jsxDEV2("label", {
                    children: [
                      "Logo Path:",
                      /* @__PURE__ */ jsxDEV2("input", {
                        type: "text",
                        class: inputStyle,
                        value: form22.logo.path,
                        onInput: (e) => updateLogo("path", e.target.value),
                        placeholder: "Path to logo image"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV2("label", {
                    children: [
                      "Logo Size Percentage:",
                      /* @__PURE__ */ jsxDEV2("input", {
                        type: "number",
                        class: inputStyle,
                        value: form22.logo.sizePercentage,
                        min: "0.1",
                        max: "0.5",
                        step: "0.05",
                        onInput: (e) => updateLogo("sizePercentage", parseFloat(e.target.value))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV2("label", {
                    children: [
                      "Logo Gap Percentage:",
                      /* @__PURE__ */ jsxDEV2("input", {
                        type: "number",
                        class: inputStyle,
                        value: form22.logo.gapPercentage,
                        min: "0.1",
                        max: "0.4",
                        step: "0.05",
                        onInput: (e) => updateLogo("gapPercentage", parseFloat(e.target.value))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("button", {
            class: buttonStyle,
            onClick: generateQRCode,
            disabled: isLoading,
            children: isLoading ? "Generating..." : "Generate QR Code"
          }, undefined, false, undefined, this),
          qrCodeUrl && /* @__PURE__ */ jsxDEV2("div", {
            class: previewStyle,
            children: [
              /* @__PURE__ */ jsxDEV2("h3", {
                children: "Preview"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("img", {
                src: qrCodeUrl,
                alt: "Generated QR Code"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("br", {}, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("a", {
                href: qrCodeUrl,
                download: "qr-code.png",
                class: buttonStyle,
                children: "Download QR Code"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var fadeIn = keyframes2`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;
var slideIn = keyframes2`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`;
function App() {
  const [showAdvanced, setShowAdvanced] = useState2(false);
  const [isUpdating, startViewTransition3] = useViewTransition2();
  const [transitionClass] = useState2(() => viewTransition(css2`
      ::view-transition-old(root) {
        animation: ${fadeIn} 0.3s ease-out;
      }
      ::view-transition-new(root) {
        animation: ${fadeIn} 0.3s ease-in;
      }
    `));
  const toggleAdvanced = () => {
    startViewTransition3(() => {
      setShowAdvanced((prev) => !prev);
    });
  };
  const appStyle = css2`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    
    ${transitionClass}
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      
      ${isUpdating && css2`
        &:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #007bff, #28a745, #17a2b8, #ffc107, #dc3545, #007bff);
          background-size: 200% 100%;
          animation: loading 2s linear infinite;
          z-index: 1000;
        }
        
        @keyframes loading {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}
    }
    
    .header {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
      
      h1 {
        margin: 0;
        font-size: 2.5em;
        font-weight: 300;
        animation: ${slideIn} 0.5s ease-out;
      }
      
      .subtitle {
        margin-top: 10px;
        opacity: 0.9;
        font-size: 1.1em;
      }
    }
    
    .nav {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 25px;
        background: white;
        color: #007bff;
        border: 2px solid #007bff;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: #007bff;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
        }
        
        &.active {
          background: #007bff;
          color: white;
        }
      }
    }
    
    .content {
      padding: 0;
      position: relative;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 30px;
      
      .feature-card {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
        
        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        h3 {
          color: #007bff;
          margin-bottom: 10px;
        }
        
        p {
          color: #666;
          line-height: 1.6;
        }
      }
    }
    
    .demo-section {
      padding: 30px;
      background: #f8f9fa;
      
      h2 {
        color: #333;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .demo-qr {
        text-align: center;
        padding: 20px;
        background: white;
        border-radius: 10px;
        margin: 20px 0;
        
        img {
          max-width: 200px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          
          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  `;
  const DemoQRCode = () => {
    const [count, setCount] = useState2(0);
    const handleClick = () => {
      startViewTransition3(() => {
        setCount((prev) => prev + 1);
      });
    };
    return /* @__PURE__ */ jsxDEV2("div", {
      class: "demo-qr",
      children: [
        /* @__PURE__ */ jsxDEV2("h3", {
          children: "Interactive Demo"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("p", {
          children: "Click the button to see view transitions in action!"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("img", {
          src: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Clicked+${count}+times`,
          alt: "Demo QR Code"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("br", {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("button", {
          onClick: handleClick,
          style: {
            marginTop: "15px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            background: "#007bff",
            color: "white",
            cursor: "pointer"
          },
          children: [
            "Click me! (",
            count,
            " clicks)"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  return /* @__PURE__ */ jsxDEV2(Fragment2, {
    children: [
      /* @__PURE__ */ jsxDEV2(Style2, {}, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        class: appStyle,
        children: /* @__PURE__ */ jsxDEV2("div", {
          class: "container",
          children: [
            /* @__PURE__ */ jsxDEV2("header", {
              class: "header",
              children: [
                /* @__PURE__ */ jsxDEV2("h1", {
                  children: "QR Code Generator"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV2("p", {
                  class: "subtitle",
                  children: "Powered by Hono JSX DOM"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV2("nav", {
              class: "nav",
              children: [
                /* @__PURE__ */ jsxDEV2("button", {
                  class: !showAdvanced ? "active" : "",
                  onClick: () => startViewTransition3(() => setShowAdvanced(false)),
                  children: "Generator"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV2("button", {
                  class: showAdvanced ? "active" : "",
                  onClick: () => startViewTransition3(() => setShowAdvanced(true)),
                  children: "Demo & Features"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV2("main", {
              class: "content",
              children: !showAdvanced ? /* @__PURE__ */ jsxDEV2(QRCodeGenerator, {}, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV2(Fragment2, {
                children: [
                  /* @__PURE__ */ jsxDEV2("div", {
                    class: "demo-section",
                    children: [
                      /* @__PURE__ */ jsxDEV2("h2", {
                        children: "Interactive Features Demo"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2(DemoQRCode, {}, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV2("div", {
                    class: "features",
                    children: [
                      /* @__PURE__ */ jsxDEV2("div", {
                        class: "feature-card",
                        onClick: () => startViewTransition3(() => setShowAdvanced(false)),
                        children: [
                          /* @__PURE__ */ jsxDEV2("h3", {
                            children: "\uD83C\uDFA8 Custom Design"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsxDEV2("p", {
                            children: "Choose colors, shapes, and styles for your QR codes"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ jsxDEV2("div", {
                        class: "feature-card",
                        onClick: () => startViewTransition3(() => setShowAdvanced(false)),
                        children: [
                          /* @__PURE__ */ jsxDEV2("h3", {
                            children: "\uD83D\uDDBC️ Logo Support"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsxDEV2("p", {
                            children: "Add your logo to QR codes with customizable size and positioning"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ jsxDEV2("div", {
                        class: "feature-card",
                        onClick: () => startViewTransition3(() => setShowAdvanced(false)),
                        children: [
                          /* @__PURE__ */ jsxDEV2("h3", {
                            children: "⚡ Real-time Preview"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsxDEV2("p", {
                            children: "See changes instantly as you customize your QR code"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ jsxDEV2("div", {
                        class: "feature-card",
                        onClick: () => startViewTransition3(() => setShowAdvanced(false)),
                        children: [
                          /* @__PURE__ */ jsxDEV2("h3", {
                            children: "\uD83D\uDCF1 Responsive Design"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsxDEV2("p", {
                            children: "Works seamlessly on desktop and mobile devices"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ jsxDEV2("div", {
                        class: "feature-card",
                        children: [
                          /* @__PURE__ */ jsxDEV2("h3", {
                            children: "\uD83D\uDD04 View Transitions"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsxDEV2("p", {
                            children: "Smooth animations powered by the View Transitions API"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ jsxDEV2("div", {
                        class: "feature-card",
                        children: [
                          /* @__PURE__ */ jsxDEV2("h3", {
                            children: "⚛️ React Hooks"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsxDEV2("p", {
                            children: "Built with familiar React-compatible hooks like useState and useEffect"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/client-entry.tsx
var root = document.getElementById("root");
if (root) {
  render(/* @__PURE__ */ jsxDEV(App, {}, undefined, false, undefined, this), root);
} else {
  console.error("Root element not found");
}
