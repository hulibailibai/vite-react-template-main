import { EventEmitter } from "node:events";
import { Writable } from "node:stream";
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = () => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  };
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
const _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
const _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
const nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
class PerformanceEntry {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
}
const PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
class PerformanceMeasure extends PerformanceEntry {
  entryType = "measure";
}
class PerformanceResourceTiming extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
}
class PerformanceObserverEntryList {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
}
class Performance {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
}
class PerformanceObserver {
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
}
const performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
const hrtime$1 = /* @__PURE__ */ Object.assign(function hrtime(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, { bigint: function bigint() {
  return BigInt(Date.now() * 1e6);
} });
class WriteStream {
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
}
class ReadStream {
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
}
const NODE_VERSION = "22.14.0";
class Process extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw /* @__PURE__ */ createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ createNotImplementedError("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ createNotImplementedError("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ createNotImplementedError("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
}
const globalProcess = globalThis["process"];
const getBuiltinModule = globalProcess.getBuiltinModule;
const { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
const unenvProcess = new Process({
  env: globalProcess.env,
  hrtime: hrtime$1,
  nextTick
});
const {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime2,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version: version$1,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
const _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime2,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version: version$1,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
globalThis.process = _process;
const noop = Object.assign(() => {
}, { __unenv__: true });
const _console = globalThis.console;
const _ignoreErrors = true;
const _stderr = new Writable();
const _stdout = new Writable();
const Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
const _times = /* @__PURE__ */ new Map();
const _stdoutErrorHandler = noop;
const _stderrErrorHandler = noop;
const workerdConsole = globalThis["console"];
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
globalThis.console = workerdConsole;
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index2 = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index2) {
        throw new Error("next() called multiple times");
      }
      index2 = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};
var GET_MATCH_RESULT = Symbol();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index2) => {
    if (index2 === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index2) => {
    const mark = `@${index2}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf(
    "/",
    url.charCodeAt(9) === 58 ? 13 : 8
  );
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw[key]();
  };
  json() {
    return this.#cachedBody("json");
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};
var HtmlEscapedCallbackPhase = {
  Stringify: 1
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
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  {
    return resStr;
  }
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    this.header("Location", String(location));
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono$1 = class Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono$1({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = class Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index2, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index2;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node$1();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node$1();
      }
    }
    node.insert(restTokens, index2, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node$1();
  insert(path, index2, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index2, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index2 = match.indexOf("", 1);
      return [matcher[1][index2], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          if (!part) {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};
var Hono2 = class extends Hono$1 {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  };
};
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== void 0 ? "NO_COLOR" in process2?.env : false;
  return !isNoColor;
}
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
};
var colorStatus = async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  };
};
var prettyJSON = (options) => {
  const targetQuery = "pretty";
  return async function prettyJSON2(c, next) {
    const pretty = c.req.query(targetQuery) || c.req.query(targetQuery) === "";
    await next();
    if (pretty && c.res.headers.get("Content-Type")?.startsWith("application/json")) {
      const obj = await c.res.json();
      c.res = new Response(JSON.stringify(obj, null, 2), c.res);
    }
  };
};
class D1Database {
  env;
  constructor(env2) {
    this.env = env2;
  }
  // 邮箱验证码相关操作
  async createEmailVerificationCode(email, code) {
    console.log("Creating verification code:", { email, code });
    await this.env.DB.prepare(`
      INSERT INTO email_verification_codes (email, code, expires_at, used, created_at)
      VALUES (?, ?, datetime('now', '+10 minutes'), 0, datetime('now'))
    `).bind(email, code).run();
    console.log("Verification code created successfully");
  }
  async getEmailVerificationCode(email, code) {
    console.log("Querying verification code for:", { email, code });
    const allMatches = await this.env.DB.prepare(`
      SELECT *, datetime('now') as current_time, 
             (datetime(expires_at) > datetime('now')) as is_not_expired,
             (used = 0) as is_not_used
      FROM email_verification_codes 
      WHERE email = ? AND code = ?
      ORDER BY created_at DESC
    `).bind(email, code).all();
    console.log("All matching verification codes:", allMatches.results);
    const result = await this.env.DB.prepare(`
      SELECT *, datetime('now') as current_time FROM email_verification_codes 
      WHERE email = ? AND code = ? AND used = 0 AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, code).first();
    console.log("Valid verification code query result:", result);
    return result || null;
  }
  async markEmailVerificationCodeAsUsed(email, code) {
    await this.env.DB.prepare(`
      UPDATE email_verification_codes 
      SET used = 1 
      WHERE email = ? AND code = ?
    `).bind(email, code).run();
  }
  async getAllEmailVerificationCodes(email) {
    const result = await this.env.DB.prepare(`
      SELECT *, datetime('now') as current_time FROM email_verification_codes 
      WHERE email = ?
      ORDER BY created_at DESC
    `).bind(email).all();
    return result.results || [];
  }
  async cleanupExpiredVerificationCodes() {
    await this.env.DB.prepare(`
      DELETE FROM email_verification_codes 
      WHERE datetime(expires_at) < datetime('now') OR used = 1
    `).run();
  }
  // 用户相关操作
  async getUserById(id) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(id).first();
    return result ? this.mapUserFromDB(result) : null;
  }
  async getUserByEmail(email) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email).first();
    return result ? this.mapUserFromDB(result) : null;
  }
  async getUserByUsername(username) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).bind(username).first();
    return result ? this.mapUserFromDB(result) : null;
  }
  async getUserByPhone(phone) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE phone = ?"
    ).bind(phone).first();
    return result ? this.mapUserFromDB(result) : null;
  }
  async getUserByOAuth(provider, oauthId) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?"
    ).bind(provider, oauthId).first();
    return result ? this.mapUserFromDB(result) : null;
  }
  async createUser(userData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    console.log("Creating user with data:", {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      oauth_provider: userData.oauth_provider,
      oauth_id: userData.oauth_id
    });
    const result = await this.env.DB.prepare(`
      INSERT INTO users (
        username, email, password_hash, oauth_provider, oauth_id, 
        role, avatar_url, balance, total_earnings, status, wechat_openid, phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userData.username,
      userData.email,
      userData.password_hash || "",
      userData.oauth_provider || null,
      userData.oauth_id || null,
      userData.role,
      userData.avatar_url || null,
      userData.balance,
      userData.total_earnings,
      userData.status,
      userData.wechat_openid || null,
      userData.phone || null,
      now,
      now
    ).run();
    console.log("Insert result:", {
      success: result.success,
      lastRowId: result.meta?.last_row_id,
      changes: result.meta?.changes
    });
    if (!result.success) {
      throw new Error("Failed to create user");
    }
    if (!result.meta?.last_row_id) {
      throw new Error("No last_row_id returned from insert");
    }
    const newUser = await this.getUserById(result.meta.last_row_id);
    if (!newUser) {
      throw new Error(`Failed to retrieve created user with id: ${result.meta.last_row_id}`);
    }
    console.log("Created user successfully:", { id: newUser.id, email: newUser.email });
    return newUser;
  }
  async updateUser(id, updates) {
    const setClause = Object.keys(updates).filter((key) => key !== "id" && key !== "created_at").map((key) => `${key} = ?`).join(", ");
    if (!setClause) return null;
    const values = Object.entries(updates).filter(([key]) => key !== "id" && key !== "created_at").map(([, value]) => value);
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(id);
    await this.env.DB.prepare(`
      UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?
    `).bind(...values).run();
    return await this.getUserById(id);
  }
  // 分类相关操作
  async getCategories() {
    const categories = await this.env.DB.prepare(
      "SELECT * FROM categories WHERE parent_id IS NULL AND is_active = 1 ORDER BY sort_order"
    ).all();
    const result = [];
    for (const category of categories.results) {
      const children = await this.env.DB.prepare(
        "SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order"
      ).bind(category.id).all();
      result.push({
        id: category.id,
        name: category.name,
        parent_id: category.parent_id || void 0,
        region: category.region || "global",
        sort_order: category.sort_order,
        is_active: Boolean(category.is_active),
        children: children.results.map((child) => ({
          id: child.id,
          name: child.name,
          parent_id: child.parent_id,
          region: child.region || "global",
          sort_order: child.sort_order,
          is_active: Boolean(child.is_active)
        }))
      });
    }
    return result;
  }
  async getCategoryById(id) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM categories WHERE id = ?"
    ).bind(id).first();
    if (!result) return null;
    return {
      id: result.id,
      name: result.name,
      parent_id: result.parent_id || void 0,
      region: result.region || "global",
      sort_order: result.sort_order,
      is_active: Boolean(result.is_active)
    };
  }
  // 用户管理相关操作
  async getUsers(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      search,
      role,
      status
    } = params;
    const conditions = [];
    const bindings = [];
    if (search) {
      conditions.push("(username LIKE ? OR email LIKE ? OR phone LIKE ?)");
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    if (role && role !== "all") {
      conditions.push("role = ?");
      bindings.push(role);
    }
    if (status && status !== "all") {
      conditions.push("status = ?");
      bindings.push(status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM users ${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    const users = await this.env.DB.prepare(`
      SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();
    const items = users.results?.map((row) => {
      return this.mapUserFromDB(row);
    }) || [];
    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  // 获取包含统计数据的用户列表（用于佣金管理页面）
  async getUsersWithStats(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      search,
      role,
      status
    } = params;
    const conditions = [];
    const bindings = [];
    if (search) {
      conditions.push("(u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    if (role && role !== "all") {
      conditions.push("u.role = ?");
      bindings.push(role);
    }
    if (status && status !== "all") {
      conditions.push("u.status = ?");
      bindings.push(status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT 
        u.*,
        COALESCE(w.workflow_count, 0) as workflow_count,
        COALESCE(f.favorite_count, 0) as favorite_count,
        COALESCE(d.download_count, 0) as download_count,
        0 as conversation_count
      FROM users u
      LEFT JOIN (
        SELECT creator_id, COUNT(*) as workflow_count
        FROM coze_workflows 
        WHERE status = 'online'
        GROUP BY creator_id
      ) w ON u.id = w.creator_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as favorite_count
        FROM coze_workflow_favorites
        GROUP BY user_id
      ) f ON u.id = f.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as download_count
        FROM coze_workflow_downloads
        GROUP BY user_id
      ) d ON u.id = d.user_id
      ${whereClause}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const users = await this.env.DB.prepare(query).bind(...bindings, pageSize, offset).all();
    const items = users.results?.map((row) => {
      const user = this.mapUserFromDB(row);
      return {
        ...user,
        workflow_count: row.workflow_count || 0,
        favorite_count: row.favorite_count || 0,
        download_count: row.download_count || 0,
        conversation_count: row.conversation_count || 0
      };
    }) || [];
    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  async updateUserRole(id, role) {
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      return null;
    }
    if (currentUser.role === "creator" && role === "user") {
      await this.cleanupCreatorData(id);
    }
    await this.env.DB.prepare(`
      UPDATE users SET role = ?, updated_at = ? WHERE id = ?
    `).bind(role, (/* @__PURE__ */ new Date()).toISOString(), id).run();
    return await this.getUserById(id);
  }
  // 清理创作者相关数据
  async cleanupCreatorData(userId) {
    try {
      await this.env.DB.prepare(`
        DELETE FROM creator_applications WHERE user_id = ?
      `).bind(userId).run();
      await this.env.DB.prepare(`
        DELETE FROM notifications WHERE recipient_id = ? AND type = 'creator_application'
      `).bind(userId).run();
      console.log(`已清理用户 ${userId} 的创作者相关数据`);
    } catch (error) {
      console.error("清理创作者数据时发生错误:", error);
      throw error;
    }
  }
  async updateUserStatus(id, status) {
    try {
      console.log(`Updating user ${id} status to ${status}`);
      const result = await this.env.DB.prepare(`
        UPDATE users SET status = ?, updated_at = ? WHERE id = ?
      `).bind(status, (/* @__PURE__ */ new Date()).toISOString(), id).run();
      console.log("Update result:", result);
      if (!result.success) {
        console.error("Failed to update user status:", result);
        throw new Error("Database update failed");
      }
      if (result.changes === 0) {
        console.error("No user found with id:", id);
        return null;
      }
      const updatedUser = await this.getUserById(id);
      console.log("Updated user:", updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  }
  async deleteUser(id) {
    try {
      const userInfo = await this.env.DB.prepare(
        "SELECT email FROM users WHERE id = ?"
      ).bind(id).first();
      if (userInfo) {
        await this.env.DB.prepare(
          "DELETE FROM email_verification_codes WHERE email = ?"
        ).bind(userInfo.email).run();
      }
      await this.env.DB.prepare(
        "DELETE FROM user_settings WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM user_preferences WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM user_likes WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM user_favorites WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM download_logs WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM orders WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM creator_applications WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM files WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM reviews WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM user_workflows WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM transactions WHERE user_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM advertisements WHERE advertiser_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "DELETE FROM notifications WHERE recipient_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "UPDATE notifications SET sender_id = NULL WHERE sender_id = ?"
      ).bind(id).run();
      await this.env.DB.prepare(
        "UPDATE admin_logs SET admin_id = NULL WHERE admin_id = ?"
      ).bind(id).run();
      const result = await this.env.DB.prepare(
        "DELETE FROM users WHERE id = ?"
      ).bind(id).run();
      return result.success;
    } catch (error) {
      console.error("删除用户时发生错误:", error);
      return false;
    }
  }
  // 统计数据
  async getDashboardStats() {
    const [userStats, workflowStats, downloadStats, creatorApplicationStats] = await Promise.all([
      this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_users
        FROM users
      `).first(),
      Promise.resolve({
        total_workflows: 0,
        pending_workflows: 0,
        approved_workflows: 0,
        new_workflows: 0,
        total_downloads: 0,
        total_revenue: 0
      }),
      Promise.resolve({ today_downloads: 0 }),
      this.env.DB.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_creator_applications
        FROM creator_applications
      `).first()
      // AI apps related statistics removed as ai_apps table no longer exists
    ]);
    const totalRevenue = parseFloat(workflowStats?.total_revenue || "0");
    return {
      totalUsers: userStats?.total_users || 0,
      activeUsers: userStats?.active_users || 0,
      newUsers: userStats?.new_users || 0,
      totalWorkflows: workflowStats?.total_workflows || 0,
      pendingWorkflows: workflowStats?.pending_workflows || 0,
      // pendingAIApps removed as ai_apps table no longer exists
      pendingCreatorApplications: creatorApplicationStats?.pending_creator_applications || 0,
      todayDownloads: downloadStats?.today_downloads || 0,
      totalRevenue,
      monthlyRevenue: totalRevenue * 0.3
      // 假设30%是本月收入
    };
  }
  // 创作者申请相关操作
  async getCreatorApplications(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      status
    } = params;
    const conditions = [];
    const bindings = [];
    if (status && status !== "all") {
      conditions.push("ca.status = ?");
      bindings.push(status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM creator_applications ca ${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    const applications = await this.env.DB.prepare(`
      SELECT 
        ca.*,
        u.username,
        u.email,
        u.avatar_url,
        reviewer.username as reviewer_name
      FROM creator_applications ca
      LEFT JOIN users u ON ca.user_id = u.id
      LEFT JOIN users reviewer ON ca.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY ca.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();
    const items = applications.results?.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      country: row.country,
      linkedin: row.linkedin,
      experience: row.experience,
      portfolio: row.portfolio,
      reason: row.reason,
      skills: row.skills,
      status: row.status,
      admin_comment: row.admin_comment,
      reviewed_by: row.reviewed_by,
      reviewer_name: row.reviewer_name,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    })) || [];
    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  async reviewCreatorApplication(id, reviewData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.env.DB.prepare(`
      UPDATE creator_applications 
      SET status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      reviewData.status,
      reviewData.admin_comment || null,
      reviewData.reviewed_by,
      now,
      now,
      id
    ).run();
    if (!result.success) {
      return null;
    }
    const application = await this.env.DB.prepare(
      "SELECT user_id FROM creator_applications WHERE id = ?"
    ).bind(id).first();
    if (application) {
      const userId = application.user_id;
      if (reviewData.status === "approved") {
        await this.env.DB.prepare(
          "UPDATE users SET role = ?, updated_at = ? WHERE id = ?"
        ).bind("creator", now, userId).run();
      }
      const notificationTitle = reviewData.status === "approved" ? "🎉 创作者申请审核通过！" : "❌ 创作者申请审核未通过";
      const notificationContent = reviewData.status === "approved" ? "恭喜您！您的创作者申请已通过审核，现在您可以开始创建和销售工作流了。欢迎加入我们的创作者社区！" : `很抱歉，您的创作者申请未通过审核。${reviewData.admin_comment ? "审核意见：" + reviewData.admin_comment : "请完善您的申请信息后重新提交。"}`;
      await this.createNotification({
        recipient_id: userId,
        sender_id: reviewData.reviewed_by,
        type: "creator_application",
        title: notificationTitle,
        content: notificationContent
      });
    }
    const updatedApplication = await this.env.DB.prepare(`
      SELECT 
        ca.*,
        u.username,
        u.email,
        u.avatar_url,
        reviewer.username as reviewer_name
      FROM creator_applications ca
      LEFT JOIN users u ON ca.user_id = u.id
      LEFT JOIN users reviewer ON ca.reviewed_by = reviewer.id
      WHERE ca.id = ?
    `).bind(id).first();
    if (!updatedApplication) {
      return null;
    }
    const row = updatedApplication;
    return {
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      country: row.country,
      linkedin: row.linkedin,
      experience: row.experience,
      portfolio: row.portfolio,
      reason: row.reason,
      skills: row.skills,
      status: row.status,
      admin_comment: row.admin_comment,
      reviewed_by: row.reviewed_by,
      reviewer_name: row.reviewer_name,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
  // 消息通知相关操作
  async createNotification(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.env.DB.prepare(`
      INSERT INTO notifications (
        recipient_id, sender_id, type, title, content, is_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.recipient_id,
      data.sender_id || null,
      data.type,
      data.title,
      data.content,
      false,
      now,
      now
    ).run();
    if (!result.success || !result.meta?.last_row_id) {
      throw new Error("Failed to create notification");
    }
    const notification = await this.env.DB.prepare(
      "SELECT * FROM notifications WHERE id = ?"
    ).bind(result.meta.last_row_id).first();
    return this.mapNotificationFromDB(notification);
  }
  async getNotifications(params) {
    const {
      recipient_id,
      is_read,
      type,
      page = 1,
      pageSize = 20
    } = params;
    const conditions = ["recipient_id = ?"];
    const bindings = [recipient_id];
    if (is_read !== void 0) {
      conditions.push("is_read = ?");
      bindings.push(is_read);
    }
    if (type) {
      conditions.push("type = ?");
      bindings.push(type);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    const notifications = await this.env.DB.prepare(`
      SELECT 
        n.*,
        sender.username as sender_username,
        sender.avatar_url as sender_avatar
      FROM notifications n
      LEFT JOIN users sender ON n.sender_id = sender.id
      ${whereClause}
      ORDER BY n.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();
    const items = notifications.results?.map((row) => ({
      ...this.mapNotificationFromDB(row),
      sender_username: row.sender_username,
      sender_avatar: row.sender_avatar
    })) || [];
    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
  async markNotificationAsRead(id) {
    const result = await this.env.DB.prepare(
      "UPDATE notifications SET is_read = ?, updated_at = ? WHERE id = ?"
    ).bind(true, (/* @__PURE__ */ new Date()).toISOString(), id).run();
    return result.success;
  }
  async markAllNotificationsAsRead(recipient_id) {
    const result = await this.env.DB.prepare(
      "UPDATE notifications SET is_read = ?, updated_at = ? WHERE recipient_id = ? AND is_read = ?"
    ).bind(true, (/* @__PURE__ */ new Date()).toISOString(), recipient_id, false).run();
    return result.success;
  }
  async getUnreadNotificationCount(recipient_id) {
    const result = await this.env.DB.prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = ?"
    ).bind(recipient_id, false).first();
    return result?.count || 0;
  }
  async deleteNotification(id) {
    const result = await this.env.DB.prepare(
      "DELETE FROM notifications WHERE id = ?"
    ).bind(id).run();
    return result.success;
  }
  // 管理员日志相关操作
  async addAdminLog(logData) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          target_type TEXT NOT NULL,
          target_id INTEGER NOT NULL,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES users(id)
        )
      `).run();
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id)
      `).run();
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action)
      `).run();
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id)
      `).run();
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at)
      `).run();
      await this.env.DB.prepare(`
        INSERT INTO admin_logs (
          admin_id, action, target_type, target_id, details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        logData.admin_id,
        logData.action,
        logData.target_type,
        logData.target_id,
        logData.details,
        now
      ).run();
    } catch (error) {
      console.error("addAdminLog error:", error);
      throw error;
    }
  }
  // 添加通知方法
  async addNotification(notificationData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.env.DB.prepare(`
      INSERT INTO notifications (
        recipient_id, type, title, content, related_id, is_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notificationData.user_id,
      notificationData.type,
      notificationData.title,
      notificationData.content,
      notificationData.related_id || null,
      false,
      now,
      now
    ).run();
  }
  // 文件相关操作
  async getFileByPath(filePath) {
    const result = await this.env.DB.prepare(
      "SELECT id, user_id, filename FROM files WHERE filename = ?"
    ).bind(filePath).first();
    return result ? {
      id: result.id,
      user_id: result.user_id,
      filename: result.filename
    } : null;
  }
  // 用户设置相关操作
  async getUserSettings(user_id) {
    const result = await this.env.DB.prepare(
      "SELECT * FROM user_settings WHERE user_id = ?"
    ).bind(user_id).first();
    return result ? this.mapUserSettingsFromDB(result) : null;
  }
  async createOrUpdateUserSettings(user_id, settings) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await this.getUserSettings(user_id);
    if (existing) {
      const setClause = Object.keys(settings).filter((key) => key !== "id" && key !== "user_id" && key !== "created_at").map((key) => `${key} = ?`).join(", ");
      if (setClause) {
        const values = Object.entries(settings).filter(([key]) => key !== "id" && key !== "user_id" && key !== "created_at").map(([, value]) => value);
        values.push(now);
        values.push(user_id);
        await this.env.DB.prepare(`
          UPDATE user_settings SET ${setClause}, updated_at = ? WHERE user_id = ?
        `).bind(...values).run();
      }
    } else {
      await this.env.DB.prepare(`
        INSERT INTO user_settings (
          user_id, email_notifications, push_notifications, welcome_shown, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        user_id,
        settings.email_notifications ?? true,
        settings.push_notifications ?? true,
        settings.welcome_shown ?? false,
        now,
        now
      ).run();
    }
    const updatedSettings = await this.getUserSettings(user_id);
    if (!updatedSettings) {
      throw new Error("Failed to create or update user settings");
    }
    return updatedSettings;
  }
  // 辅助方法
  mapUserFromDB(row) {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      balance: parseFloat(row.balance || "0"),
      total_earnings: parseFloat(row.total_earnings || "0"),
      wh_coins: parseInt(row.wh_coins || "0"),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      avatar_url: row.avatar_url,
      oauth_provider: row.oauth_provider,
      oauth_id: row.oauth_id,
      password_hash: row.password_hash,
      wechat_openid: row.wechat_openid,
      phone: row.phone
    };
  }
  // mapWorkflowFromDB method removed - workflows table no longer exists
  mapNotificationFromDB(row) {
    return {
      id: row.id,
      recipient_id: row.recipient_id,
      sender_id: row.sender_id,
      type: row.type,
      title: row.title,
      content: row.content,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
  mapUserSettingsFromDB(row) {
    return {
      id: row.id,
      user_id: row.user_id,
      email_notifications: Boolean(row.email_notifications),
      push_notifications: Boolean(row.push_notifications),
      welcome_shown: Boolean(row.welcome_shown),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
  // ==================== 社区帖子相关方法 ====================
  // 获取AI应用的社区帖子列表
  async getCommunityPosts(aiAppId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const posts = await this.env.DB.prepare(`
        SELECT 
          cp.id,
          cp.content,
          cp.like_count,
          cp.reply_count,
          cp.created_at,
          u.id as user_id,
          u.username,
          u.avatar_url
        FROM community_posts cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.ai_app_id = ? AND cp.status = 'active'
        ORDER BY cp.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(aiAppId, limit, offset).all();
      const totalResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM community_posts 
        WHERE ai_app_id = ? AND status = 'active'
      `).bind(aiAppId).first();
      const total = totalResult?.total || 0;
      const totalPages = Math.ceil(total / limit);
      const formattedPosts = posts.results.map((post) => ({
        id: post.id,
        content: post.content,
        like_count: post.like_count,
        reply_count: post.reply_count,
        created_at: post.created_at,
        user: {
          id: post.user_id,
          username: post.username,
          avatar_url: post.avatar_url
        }
      }));
      return {
        success: true,
        data: {
          posts: formattedPosts,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error("Get community posts error:", error);
      return { success: false, message: "获取帖子列表失败" };
    }
  }
  // 创建社区帖子
  async createCommunityPost(aiAppId, userId, content) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const result = await this.env.DB.prepare(`
        INSERT INTO community_posts (ai_app_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(aiAppId, userId, content, now, now).run();
      if (!result.success) {
        return { success: false, message: "创建帖子失败" };
      }
      const user = await this.env.DB.prepare(`
        SELECT id, username, avatar_url FROM users WHERE id = ?
      `).bind(userId).first();
      const newPost = {
        id: result.meta.last_row_id,
        content,
        like_count: 0,
        reply_count: 0,
        created_at: now,
        user: {
          id: userId,
          username: user?.username,
          avatar_url: user?.avatar_url
        }
      };
      return { success: true, data: newPost };
    } catch (error) {
      console.error("Create community post error:", error);
      return { success: false, message: "创建帖子失败" };
    }
  }
  // 切换帖子点赞状态
  async togglePostLike(postId, userId) {
    try {
      const existingLike = await this.env.DB.prepare(`
        SELECT id FROM community_post_likes WHERE post_id = ? AND user_id = ?
      `).bind(postId, userId).first();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let isLiked = false;
      if (existingLike) {
        await this.env.DB.prepare(`
          DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?
        `).bind(postId, userId).run();
        await this.env.DB.prepare(`
          UPDATE community_posts SET like_count = like_count - 1 WHERE id = ?
        `).bind(postId).run();
        isLiked = false;
      } else {
        await this.env.DB.prepare(`
          INSERT INTO community_post_likes (post_id, user_id, created_at)
          VALUES (?, ?, ?)
        `).bind(postId, userId, now).run();
        await this.env.DB.prepare(`
          UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?
        `).bind(postId).run();
        isLiked = true;
      }
      const post = await this.env.DB.prepare(`
        SELECT like_count FROM community_posts WHERE id = ?
      `).bind(postId).first();
      return {
        success: true,
        data: {
          isLiked,
          likeCount: post?.like_count || 0
        }
      };
    } catch (error) {
      console.error("Toggle post like error:", error);
      return { success: false, message: "操作失败" };
    }
  }
  // 获取帖子回复列表
  async getPostReplies(postId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const replies = await this.env.DB.prepare(`
        SELECT 
          cpr.id,
          cpr.content,
          cpr.like_count,
          cpr.created_at,
          u.id as user_id,
          u.username,
          u.avatar_url
        FROM community_post_replies cpr
        LEFT JOIN users u ON cpr.user_id = u.id
        WHERE cpr.post_id = ? AND cpr.status = 'active'
        ORDER BY cpr.created_at ASC
        LIMIT ? OFFSET ?
      `).bind(postId, limit, offset).all();
      const totalResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM community_post_replies 
        WHERE post_id = ? AND status = 'active'
      `).bind(postId).first();
      const total = totalResult?.total || 0;
      const totalPages = Math.ceil(total / limit);
      const formattedReplies = replies.results.map((reply) => ({
        id: reply.id,
        content: reply.content,
        like_count: reply.like_count,
        created_at: reply.created_at,
        user: {
          id: reply.user_id,
          username: reply.username,
          avatar_url: reply.avatar_url
        }
      }));
      return {
        success: true,
        data: {
          replies: formattedReplies,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error("Get post replies error:", error);
      return { success: false, message: "获取回复列表失败" };
    }
  }
  // 创建帖子回复
  async createPostReply(postId, userId, content) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const result = await this.env.DB.prepare(`
        INSERT INTO community_post_replies (post_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(postId, userId, content, now, now).run();
      if (!result.success) {
        return { success: false, message: "创建回复失败" };
      }
      await this.env.DB.prepare(`
        UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = ?
      `).bind(postId).run();
      const user = await this.env.DB.prepare(`
        SELECT id, username, avatar_url FROM users WHERE id = ?
      `).bind(userId).first();
      const newReply = {
        id: result.meta.last_row_id,
        content,
        like_count: 0,
        created_at: now,
        user: {
          id: userId,
          username: user?.username,
          avatar_url: user?.avatar_url
        }
      };
      return { success: true, data: newReply };
    } catch (error) {
      console.error("Create post reply error:", error);
      return { success: false, message: "创建回复失败" };
    }
  }
  // 地区分类管理方法
  async getCategoriesByRegion(region = "global") {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM categories 
        WHERE region = ? AND is_active = 1 
        ORDER BY sort_order ASC, name ASC
      `).bind(region).all();
      return result.results?.map((row) => ({
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
        description: row.description,
        icon_url: row.icon_url,
        sort_order: row.sort_order,
        is_active: !!row.is_active,
        region: row.region
      })) || [];
    } catch (error) {
      console.error("Error getting categories by region:", error);
      return [];
    }
  }
  // 标签管理方法
  async getTagsByRegion(region = "global", categoryId) {
    try {
      let query = `
        SELECT t.*, c.name as category_name, u.username as creator_username
        FROM tags t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.region = ? AND t.is_active = 1
      `;
      const params = [region];
      if (categoryId) {
        query += " AND t.category_id = ?";
        params.push(categoryId);
      }
      query += " ORDER BY t.usage_count DESC, t.name ASC";
      const result = await this.env.DB.prepare(query).bind(...params).all();
      return result.results?.map((row) => ({
        id: row.id,
        name: row.name,
        category_id: row.category_id,
        region: row.region,
        color: row.color,
        description: row.description,
        usage_count: row.usage_count,
        is_active: !!row.is_active,
        is_system: !!row.is_system,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
        creator: row.creator_username ? { id: row.created_by, username: row.creator_username } : null
      })) || [];
    } catch (error) {
      console.error("Error getting tags by region:", error);
      return [];
    }
  }
  // 创建分类申请
  async createCategoryRequest(requestData) {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO category_requests (user_id, name, parent_id, region, description, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        requestData.user_id,
        requestData.name,
        requestData.parent_id || null,
        requestData.region,
        requestData.description || null,
        requestData.reason
      ).run();
      if (result.success) {
        return await this.getCategoryRequestById(result.meta.last_row_id);
      }
      throw new Error("Failed to create category request");
    } catch (error) {
      console.error("Error creating category request:", error);
      throw error;
    }
  }
  // 创建标签申请
  async createTagRequest(requestData) {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO tag_requests (user_id, name, category_id, region, color, description, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        requestData.user_id,
        requestData.name,
        requestData.category_id || null,
        requestData.region,
        requestData.color || "#3B82F6",
        requestData.description || null,
        requestData.reason
      ).run();
      if (result.success) {
        return await this.getTagRequestById(result.meta.last_row_id);
      }
      throw new Error("Failed to create tag request");
    } catch (error) {
      console.error("Error creating tag request:", error);
      throw error;
    }
  }
  // 获取分类申请列表
  async getCategoryRequests(params = {}) {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const offset = (page - 1) * pageSize;
      let whereClause = "1=1";
      const queryParams = [];
      if (params.status) {
        whereClause += " AND cr.status = ?";
        queryParams.push(params.status);
      }
      if (params.region) {
        whereClause += " AND cr.region = ?";
        queryParams.push(params.region);
      }
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM category_requests cr
        WHERE ${whereClause}
      `).bind(...queryParams).first();
      const total = countResult?.total || 0;
      const result = await this.env.DB.prepare(`
        SELECT cr.*, u.username, u.avatar_url, pc.name as parent_category_name,
               a.username as admin_username, cc.name as created_category_name
        FROM category_requests cr
        LEFT JOIN users u ON cr.user_id = u.id
        LEFT JOIN categories pc ON cr.parent_id = pc.id
        LEFT JOIN users a ON cr.admin_id = a.id
        LEFT JOIN categories cc ON cr.created_category_id = cc.id
        WHERE ${whereClause}
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...queryParams, pageSize, offset).all();
      const items = result.results?.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        parent_id: row.parent_id,
        region: row.region,
        description: row.description,
        reason: row.reason,
        status: row.status,
        admin_id: row.admin_id,
        admin_comment: row.admin_comment,
        created_category_id: row.created_category_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url },
        parent_category: row.parent_category_name ? { id: row.parent_id, name: row.parent_category_name } : null,
        admin: row.admin_username ? { id: row.admin_id, username: row.admin_username } : null,
        created_category: row.created_category_name ? { id: row.created_category_id, name: row.created_category_name } : null
      })) || [];
      return {
        items,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("Error getting category requests:", error);
      throw error;
    }
  }
  // 获取标签申请列表
  async getTagRequests(params = {}) {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const offset = (page - 1) * pageSize;
      let whereClause = "1=1";
      const queryParams = [];
      if (params.status) {
        whereClause += " AND tr.status = ?";
        queryParams.push(params.status);
      }
      if (params.region) {
        whereClause += " AND tr.region = ?";
        queryParams.push(params.region);
      }
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM tag_requests tr
        WHERE ${whereClause}
      `).bind(...queryParams).first();
      const total = countResult?.total || 0;
      const result = await this.env.DB.prepare(`
        SELECT tr.*, u.username, u.avatar_url, c.name as category_name,
               a.username as admin_username, ct.name as created_tag_name
        FROM tag_requests tr
        LEFT JOIN users u ON tr.user_id = u.id
        LEFT JOIN categories c ON tr.category_id = c.id
        LEFT JOIN users a ON tr.admin_id = a.id
        LEFT JOIN tags ct ON tr.created_tag_id = ct.id
        WHERE ${whereClause}
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...queryParams, pageSize, offset).all();
      const items = result.results?.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        category_id: row.category_id,
        region: row.region,
        color: row.color,
        description: row.description,
        reason: row.reason,
        status: row.status,
        admin_id: row.admin_id,
        admin_comment: row.admin_comment,
        created_tag_id: row.created_tag_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url },
        category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
        admin: row.admin_username ? { id: row.admin_id, username: row.admin_username } : null,
        created_tag: row.created_tag_name ? { id: row.created_tag_id, name: row.created_tag_name } : null
      })) || [];
      return {
        items,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("Error getting tag requests:", error);
      throw error;
    }
  }
  // 审核分类申请
  async reviewCategoryRequest(requestId, adminId, status, adminComment) {
    try {
      const request = await this.getCategoryRequestById(requestId);
      if (!request) {
        return { success: false, message: "申请不存在" };
      }
      if (request.status !== "pending") {
        return { success: false, message: "申请已被处理" };
      }
      let createdCategoryId = null;
      if (status === "approved") {
        const categoryResult = await this.env.DB.prepare(`
          INSERT INTO categories (name, parent_id, description, region, sort_order)
          VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories WHERE region = ?))
        `).bind(
          request.name,
          request.parent_id || null,
          request.description || null,
          request.region,
          request.region
        ).run();
        if (categoryResult.success) {
          createdCategoryId = categoryResult.meta.last_row_id;
        }
      }
      const updateResult = await this.env.DB.prepare(`
        UPDATE category_requests 
        SET status = ?, admin_id = ?, admin_comment = ?, created_category_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, adminId, adminComment || null, createdCategoryId, requestId).run();
      if (updateResult.success) {
        await this.createNotification({
          recipient_id: request.user_id,
          sender_id: adminId,
          type: status === "approved" ? "system" : "system",
          title: status === "approved" ? "分类申请已通过" : "分类申请被拒绝",
          content: status === "approved" ? `您申请的分类「${request.name}」已通过审核` : `您申请的分类「${request.name}」被拒绝：${adminComment || "无具体原因"}`
        });
        return { success: true, message: "审核完成" };
      }
      return { success: false, message: "更新申请状态失败" };
    } catch (error) {
      console.error("Error reviewing category request:", error);
      return { success: false, message: "审核失败" };
    }
  }
  // 审核标签申请
  async reviewTagRequest(requestId, adminId, status, adminComment) {
    try {
      const request = await this.getTagRequestById(requestId);
      if (!request) {
        return { success: false, message: "申请不存在" };
      }
      if (request.status !== "pending") {
        return { success: false, message: "申请已被处理" };
      }
      let createdTagId = null;
      if (status === "approved") {
        const tagResult = await this.env.DB.prepare(`
          INSERT INTO tags (name, category_id, region, color, description, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          request.name,
          request.category_id || null,
          request.region,
          request.color,
          request.description || null,
          request.user_id
        ).run();
        if (tagResult.success) {
          createdTagId = tagResult.meta.last_row_id;
        }
      }
      const updateResult = await this.env.DB.prepare(`
        UPDATE tag_requests 
        SET status = ?, admin_id = ?, admin_comment = ?, created_tag_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, adminId, adminComment || null, createdTagId, requestId).run();
      if (updateResult.success) {
        await this.createNotification({
          recipient_id: request.user_id,
          sender_id: adminId,
          type: status === "approved" ? "system" : "system",
          title: status === "approved" ? "标签申请已通过" : "标签申请被拒绝",
          content: status === "approved" ? `您申请的标签「${request.name}」已通过审核` : `您申请的标签「${request.name}」被拒绝：${adminComment || "无具体原因"}`
        });
        return { success: true, message: "审核完成" };
      }
      return { success: false, message: "更新申请状态失败" };
    } catch (error) {
      console.error("Error reviewing tag request:", error);
      return { success: false, message: "审核失败" };
    }
  }
  // 获取分类申请详情
  async getCategoryRequestById(id) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM category_requests WHERE id = ?
      `).bind(id).first();
      return result;
    } catch (error) {
      console.error("Error getting category request by id:", error);
      return null;
    }
  }
  // 获取标签申请详情
  async getTagRequestById(id) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM tag_requests WHERE id = ?
      `).bind(id).first();
      return result;
    } catch (error) {
      console.error("Error getting tag request by id:", error);
      return null;
    }
  }
  // 服务器管理相关操作
  async getServers(params = {}) {
    const { page = 1, pageSize = 10, search = "", server_type = "", status = "" } = params;
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE 1=1";
    const bindings = [];
    if (search) {
      whereClause += " AND (name LIKE ? OR description LIKE ? OR url LIKE ?)";
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    if (server_type) {
      whereClause += " AND server_type = ?";
      bindings.push(server_type);
    }
    if (status) {
      whereClause += " AND status = ?";
      bindings.push(status);
    }
    try {
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM servers ${whereClause}
      `).bind(...bindings).first();
      const total = countResult?.total || 0;
      const dataResult = await this.env.DB.prepare(`
        SELECT s.*, u.username as creator_name
        FROM servers s
        LEFT JOIN users u ON s.created_by = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindings, pageSize, offset).all();
      return {
        items: dataResult.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("获取服务器列表失败:", error);
      return {
        items: [],
        pagination: {
          current: page,
          pageSize,
          total: 0,
          totalPages: 0
        }
      };
    }
  }
  async getServerById(id) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT s.*, u.username as creator_name
        FROM servers s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.id = ?
      `).bind(id).first();
      return result || null;
    } catch (error) {
      console.error("获取服务器详情失败:", error);
      return null;
    }
  }
  async createServer(serverData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO servers (
          name, url, description, status, server_type, location,
          max_users, current_users, cpu_cores, memory_gb, storage_gb, bandwidth_mbps,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        serverData.name,
        serverData.url,
        serverData.description || "",
        serverData.status || "active",
        serverData.server_type || "shared",
        serverData.location || "",
        serverData.max_users || 0,
        serverData.current_users || 0,
        serverData.cpu_cores || null,
        serverData.memory_gb || null,
        serverData.storage_gb || null,
        serverData.bandwidth_mbps || null,
        serverData.created_by,
        now,
        now
      ).run();
      if (!result.success || !result.meta?.last_row_id) {
        throw new Error("Failed to create server");
      }
      return await this.getServerById(result.meta.last_row_id);
    } catch (error) {
      console.error("创建服务器失败:", error);
      throw error;
    }
  }
  async updateServer(id, updates) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
    if (!setClause) return null;
    const values = Object.values(updates);
    values.push(now);
    values.push(id);
    try {
      await this.env.DB.prepare(`
        UPDATE servers SET ${setClause}, updated_at = ? WHERE id = ?
      `).bind(...values).run();
      return await this.getServerById(id);
    } catch (error) {
      console.error("更新服务器失败:", error);
      throw error;
    }
  }
  async deleteServer(id) {
    try {
      const result = await this.env.DB.prepare(
        "DELETE FROM servers WHERE id = ?"
      ).bind(id).run();
      return result.success;
    } catch (error) {
      console.error("删除服务器失败:", error);
      return false;
    }
  }
  // 获取国家/地区列表
  async getCountries() {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM countries 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, name ASC
      `).all();
      return result.results?.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        name_en: row.name_en,
        sort_order: row.sort_order,
        is_active: !!row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) || [];
    } catch (error) {
      console.error("Error getting countries:", error);
      return [];
    }
  }
  // Coze工作流相关操作
  async getCozeWorkflows(params = {}) {
    try {
      console.log("getCozeWorkflows called with params:", params);
      const {
        page = 1,
        pageSize = 20,
        category,
        status,
        creatorId,
        featured,
        search,
        sortBy = "created_at",
        startDate,
        endDate,
        tags
      } = params;
      let whereClause = "WHERE 1=1";
      const bindings = [];
      if (category) {
        whereClause += " AND cw.category_id = ?";
        bindings.push(category);
      }
      if (status) {
        whereClause += " AND cw.status = ?";
        bindings.push(status);
      }
      if (creatorId) {
        whereClause += " AND cw.creator_id = ?";
        bindings.push(creatorId);
      }
      if (featured !== void 0) {
        whereClause += " AND cw.is_featured = ?";
        bindings.push(featured ? 1 : 0);
      }
      if (search) {
        whereClause += " AND (cw.title LIKE ? OR cw.description LIKE ?)";
        bindings.push(`%${search}%`, `%${search}%`);
      }
      if (startDate) {
        whereClause += " AND DATE(cw.updated_at) >= DATE(?)";
        bindings.push(startDate);
      }
      if (endDate) {
        whereClause += " AND DATE(cw.updated_at) <= DATE(?)";
        bindings.push(endDate);
      }
      if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => "cw.tags LIKE ?").join(" OR ");
        whereClause += ` AND (${tagConditions})`;
        tags.forEach((tag) => bindings.push(`%"${tag}"%`));
      }
      let orderClause = "ORDER BY cw.created_at DESC";
      switch (sortBy) {
        case "latest":
          orderClause = "ORDER BY cw.created_at DESC";
          break;
        case "popular":
        case "downloads":
          orderClause = "ORDER BY cw.download_count DESC";
          break;
        case "likes":
          orderClause = "ORDER BY cw.like_count DESC";
          break;
        case "views":
          orderClause = "ORDER BY cw.view_count DESC";
          break;
        case "price_asc":
          orderClause = "ORDER BY cw.price ASC";
          break;
        case "price_desc":
          orderClause = "ORDER BY cw.price DESC";
          break;
        case "hot":
          orderClause = "ORDER BY (cw.download_count * 0.4 + cw.like_count * 0.3 + cw.view_count * 0.3) DESC";
          break;
        default:
          orderClause = "ORDER BY cw.created_at DESC";
      }
      console.log("Executing count query with whereClause:", whereClause);
      console.log("Bindings:", bindings);
      const countResult = await this.env.DB.prepare(
        `SELECT COUNT(*) as total FROM coze_workflows cw ${whereClause}`
      ).bind(...bindings).first();
      const total = countResult?.total || 0;
      console.log("Total count:", total);
      const offset = (page - 1) * pageSize;
      const query = `
        SELECT cw.*, u.username as creator_username, u.avatar_url as creator_avatar_url 
        FROM coze_workflows cw 
        LEFT JOIN users u ON cw.creator_id = u.id 
        ${whereClause} ${orderClause} LIMIT ? OFFSET ?
      `;
      console.log("Executing data query:", query);
      console.log("Final bindings:", [...bindings, pageSize, offset]);
      const workflows = await this.env.DB.prepare(query).bind(...bindings, pageSize, offset).all();
      console.log("Raw coze workflow results:", workflows.results?.length || 0, "items");
      if (workflows.results && workflows.results.length > 0) {
        console.log("First coze workflow raw data:", workflows.results[0]);
      }
      const items = workflows.results?.map((row) => {
        try {
          return this.mapCozeWorkflowFromDB(row);
        } catch (mapError) {
          console.error("Error mapping coze workflow from DB:", mapError);
          console.error("Raw row data:", row);
          throw mapError;
        }
      }) || [];
      console.log("Mapped coze workflow items:", items.length);
      return {
        items,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("getCozeWorkflows error:", error);
      throw error;
    }
  }
  async getCozeWorkflowById(id) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT cw.*, u.username as creator_username, u.avatar_url as creator_avatar_url 
        FROM coze_workflows cw 
        LEFT JOIN users u ON cw.creator_id = u.id 
        WHERE cw.id = ?
      `).bind(id).first();
      return result ? this.mapCozeWorkflowFromDB(result) : null;
    } catch (error) {
      console.error("Error getting coze workflow by id:", error);
      throw error;
    }
  }
  async createCozeWorkflow(data) {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO coze_workflows (
          creator_id, title, description, category_id, subcategory_id,
          price, download_price, is_member_free, is_download_member_free, workflow_file_url, workflow_file_name, workflow_file_size,
          cover_image_url, preview_video_url, preview_images, tags,
          type, coze_api, task_id, quick_commands, is_featured, is_official,
          status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).bind(
        data.creator_id,
        data.title,
        data.description || null,
        data.category_id,
        data.subcategory_id || null,
        data.price || 0,
        data.download_price || 0,
        data.is_member_free ? 1 : 0,
        data.is_download_member_free ? 1 : 0,
        data.workflow_file_url,
        data.workflow_file_name || null,
        data.workflow_file_size || null,
        data.cover_image_url || null,
        data.preview_video_url || null,
        data.preview_images ? JSON.stringify(data.preview_images) : null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.type || "workflow",
        data.coze_api || null,
        data.task_id || null,
        data.quick_commands ? JSON.stringify(data.quick_commands) : null,
        data.is_featured ? 1 : 0,
        data.is_official ? 1 : 0
      ).run();
      if (result.success && result.meta.last_row_id) {
        return await this.getCozeWorkflowById(result.meta.last_row_id);
      }
      throw new Error("Failed to create coze workflow");
    } catch (error) {
      console.error("Error creating coze workflow:", error);
      throw error;
    }
  }
  async updateCozeWorkflow(id, data) {
    try {
      const updates = [];
      const bindings = [];
      if (data.title !== void 0) {
        updates.push("title = ?");
        bindings.push(data.title);
      }
      if (data.description !== void 0) {
        updates.push("description = ?");
        bindings.push(data.description);
      }
      if (data.category_id !== void 0) {
        updates.push("category_id = ?");
        bindings.push(data.category_id);
      }
      if (data.subcategory_id !== void 0) {
        updates.push("subcategory_id = ?");
        bindings.push(data.subcategory_id);
      }
      if (data.price !== void 0) {
        updates.push("price = ?");
        bindings.push(data.price);
      }
      if (data.download_price !== void 0) {
        updates.push("download_price = ?");
        bindings.push(data.download_price);
      }
      if (data.is_member_free !== void 0) {
        updates.push("is_member_free = ?");
        bindings.push(data.is_member_free ? 1 : 0);
      }
      if (data.is_download_member_free !== void 0) {
        updates.push("is_download_member_free = ?");
        bindings.push(data.is_download_member_free ? 1 : 0);
      }
      if (data.workflow_file_url !== void 0) {
        updates.push("workflow_file_url = ?");
        bindings.push(data.workflow_file_url);
      }
      if (data.workflow_file_name !== void 0) {
        updates.push("workflow_file_name = ?");
        bindings.push(data.workflow_file_name);
      }
      if (data.workflow_file_size !== void 0) {
        updates.push("workflow_file_size = ?");
        bindings.push(data.workflow_file_size);
      }
      if (data.cover_image_url !== void 0) {
        updates.push("cover_image_url = ?");
        bindings.push(data.cover_image_url);
      }
      if (data.preview_video_url !== void 0) {
        updates.push("preview_video_url = ?");
        bindings.push(data.preview_video_url);
      }
      if (data.preview_images !== void 0) {
        updates.push("preview_images = ?");
        bindings.push(data.preview_images ? JSON.stringify(data.preview_images) : null);
      }
      if (data.tags !== void 0) {
        updates.push("tags = ?");
        bindings.push(data.tags ? JSON.stringify(data.tags) : null);
      }
      if (data.type !== void 0) {
        updates.push("type = ?");
        bindings.push(data.type);
      }
      if (data.coze_api !== void 0) {
        updates.push("coze_api = ?");
        bindings.push(data.coze_api);
      }
      if (data.task_id !== void 0) {
        updates.push("task_id = ?");
        bindings.push(data.task_id);
      }
      if (data.quick_commands !== void 0) {
        updates.push("quick_commands = ?");
        bindings.push(data.quick_commands ? JSON.stringify(data.quick_commands) : null);
      }
      if (data.is_featured !== void 0) {
        updates.push("is_featured = ?");
        bindings.push(data.is_featured ? 1 : 0);
      }
      if (data.is_official !== void 0) {
        updates.push("is_official = ?");
        bindings.push(data.is_official ? 1 : 0);
      }
      if (updates.length === 0) {
        throw new Error("No fields to update");
      }
      updates.push("updated_at = CURRENT_TIMESTAMP");
      bindings.push(id);
      const result = await this.env.DB.prepare(`
        UPDATE coze_workflows SET ${updates.join(", ")} WHERE id = ?
      `).bind(...bindings).run();
      if (result.success && result.changes > 0) {
        return await this.getCozeWorkflowById(id);
      }
      throw new Error("Failed to update coze workflow");
    } catch (error) {
      console.error("Error updating coze workflow:", error);
      throw error;
    }
  }
  async updateCozeWorkflowStatus(id, status, reason) {
    try {
      if (reason) {
        console.log(`Updating coze workflow ${id} status to ${status}, reason: ${reason}`);
      }
      const result = await this.env.DB.prepare(`
        UPDATE coze_workflows SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(status, id).run();
      if (result.success && result.changes > 0) {
        return await this.getCozeWorkflowById(id);
      }
      throw new Error("Failed to update coze workflow status");
    } catch (error) {
      console.error("Error updating coze workflow status:", error);
      throw error;
    }
  }
  async deleteCozeWorkflow(id) {
    try {
      const workflow = await this.env.DB.prepare(`
        SELECT id, title, creator_id, status FROM coze_workflows WHERE id = ?
      `).bind(id).first();
      if (!workflow) {
        console.log(`Coze workflow ${id} does not exist`);
        return false;
      }
      console.log(`Starting deletion of coze workflow ${id}:`, {
        id: workflow.id,
        title: workflow.title,
        creator_id: workflow.creator_id,
        status: workflow.status
      });
      const batch = [
        // 1. 删除相关的视频生成任务
        this.env.DB.prepare(`DELETE FROM video_generation_tasks WHERE workflow_id = ?`).bind(id.toString()),
        // 2. 删除用户与工作流的关系记录
        this.env.DB.prepare(`DELETE FROM user_coze_workflows WHERE coze_workflow_id = ?`).bind(id),
        // 3. 删除工作流评论
        this.env.DB.prepare(`DELETE FROM coze_workflow_comments WHERE coze_workflow_id = ?`).bind(id),
        // 4. 最后删除工作流本身
        this.env.DB.prepare(`DELETE FROM coze_workflows WHERE id = ?`).bind(id)
      ];
      console.log(`Executing batch delete for workflow ${id} with ${batch.length} operations`);
      const results = await this.env.DB.batch(batch);
      const detailedResults = results.map((r, i) => {
        const operations = ["video_generation_tasks", "user_coze_workflows", "coze_workflow_comments", "coze_workflows"];
        return {
          step: i + 1,
          operation: operations[i],
          success: r.success,
          changes: r.changes,
          error: r.error,
          meta: r.meta
        };
      });
      console.log(`Batch delete results for workflow ${id}:`, detailedResults);
      const workflowDeleteResult = results[results.length - 1];
      const workflowDeleted = workflowDeleteResult.success && workflowDeleteResult.changes > 0;
      if (workflowDeleted) {
        console.log(`Coze workflow ${id} successfully deleted`);
        const failedOperations = detailedResults.slice(0, -1).filter((r) => !r.success);
        if (failedOperations.length > 0) {
          console.warn(`Some related records deletion failed for workflow ${id}:`, failedOperations);
        }
        return true;
      }
      console.error(`Failed to delete coze workflow ${id}:`, workflowDeleteResult);
      console.error(`工作流删除失败详情:`, {
        workflowId: id,
        workflowTitle: workflow.title,
        deleteResult: workflowDeleteResult,
        allResults: detailedResults
      });
      const hasErrors = results.some((result) => !result.success);
      if (hasErrors) {
        const errors = detailedResults.filter((r) => !r.success);
        console.error(`Delete operations failed for workflow ${id}:`, errors);
      }
      return false;
    } catch (error) {
      console.error(`Error deleting coze workflow ${id}:`, error);
      console.error(`删除工作流异常详情:`, {
        workflowId: id,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : void 0
      });
      try {
        const checkWorkflow = await this.env.DB.prepare(`
          SELECT id FROM coze_workflows WHERE id = ?
        `).bind(id).first();
        if (!checkWorkflow) {
          console.log(`Coze workflow ${id} was deleted despite error`);
          return true;
        } else {
          console.error(`Coze workflow ${id} still exists after deletion attempt`);
        }
      } catch (checkError) {
        console.error(`Error checking workflow ${id} after deletion error:`, checkError);
        console.error(`检查工作流存在性时发生错误:`, {
          checkErrorType: checkError instanceof Error ? checkError.constructor.name : typeof checkError,
          checkErrorMessage: checkError instanceof Error ? checkError.message : String(checkError)
        });
      }
      throw error;
    }
  }
  mapCozeWorkflowFromDB(row) {
    return {
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      subcategory_id: row.subcategory_id,
      price: row.price,
      download_price: row.download_price,
      is_member_free: Boolean(row.is_member_free),
      is_download_member_free: Boolean(row.is_download_member_free),
      workflow_file_url: row.workflow_file_url,
      workflow_file_name: row.workflow_file_name,
      workflow_file_size: row.workflow_file_size,
      cover_image_url: row.cover_image_url,
      preview_video_url: row.preview_video_url,
      preview_images: row.preview_images ? JSON.parse(row.preview_images) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      like_count: row.like_count || 0,
      favorite_count: row.favorite_count || 0,
      download_count: row.download_count || 0,
      view_count: row.view_count || 0,
      comment_count: row.comment_count || 0,
      status: row.status,
      is_featured: Boolean(row.is_featured),
      is_official: Boolean(row.is_official),
      type: row.type,
      coze_api: row.coze_api,
      task_id: row.task_id,
      quick_commands: row.quick_commands ? JSON.parse(row.quick_commands) : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      // 构建creator对象结构
      creator: row.creator_username ? {
        id: row.creator_id,
        username: row.creator_username,
        avatar_url: row.creator_avatar_url
      } : null
    };
  }
  // 初始佣金管理系统相关方法
  // 获取佣金计划列表
  async getInitialCommissionPlans(params = {}) {
    const { page = 1, pageSize = 10, status } = params;
    const offset = (page - 1) * pageSize;
    try {
      let whereClause = "";
      const bindings = [];
      if (status) {
        if (status === "active") {
          whereClause = "WHERE is_active = ?";
          bindings.push(true);
        } else if (status === "inactive") {
          whereClause = "WHERE is_active = ?";
          bindings.push(false);
        }
      }
      const countQuery = `SELECT COUNT(*) as total FROM initial_commission_plans ${whereClause}`;
      const countResult = await this.env.DB.prepare(countQuery).bind(...bindings).first();
      const total = countResult?.total || 0;
      const dataQuery = `
        SELECT 
          icp.*,
          COUNT(DISTINCT uicc.user_id) as user_count
        FROM initial_commission_plans icp
        LEFT JOIN user_initial_commission_configs uicc ON icp.id = uicc.plan_id AND uicc.is_active = true
        ${whereClause ? whereClause.replace("WHERE", "WHERE icp.") : ""}
        GROUP BY icp.id
        ORDER BY icp.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const results = await this.env.DB.prepare(dataQuery).bind(...bindings, pageSize, offset).all();
      return {
        items: results.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("获取佣金计划列表失败:", error);
      throw error;
    }
  }
  // 创建佣金计划
  async createInitialCommissionPlan(planData) {
    try {
      const query = `
        INSERT INTO initial_commission_plans (
          name, description, trigger_type, 
          fixed_amount, payout_cycle, workflow_threshold, auto_trigger, 
          target_user_type, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      const result = await this.env.DB.prepare(query).bind(
        planData.name,
        planData.description || null,
        planData.trigger_type,
        planData.amount_value || 0,
        // fixed_amount
        7,
        // payout_cycle 默认7天
        planData.workflow_threshold || null,
        // workflow_threshold
        planData.auto_trigger || false,
        // auto_trigger
        "all",
        // target_user_type 默认所有用户
        planData.status === "active" || planData.status === void 0,
        // is_active
        planData.created_by
      ).run();
      if (result.success) {
        await this.addAdminLog({
          admin_id: planData.created_by,
          action: "create_commission_plan",
          target_type: "initial_commission_plan",
          target_id: result.meta.last_row_id,
          details: `创建佣金计划: ${planData.name}`
        });
        return { id: result.meta.last_row_id, ...planData };
      }
      throw new Error("创建佣金计划失败");
    } catch (error) {
      console.error("创建佣金计划失败:", error);
      throw error;
    }
  }
  // 更新佣金计划
  async updateInitialCommissionPlan(id, updates) {
    try {
      const setParts = [];
      const bindings = [];
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== "updated_by" && value !== void 0) {
          setParts.push(`${key} = ?`);
          bindings.push(value);
        }
      });
      setParts.push("updated_at = datetime('now')");
      bindings.push(id);
      const query = `
        UPDATE initial_commission_plans 
        SET ${setParts.join(", ")} 
        WHERE id = ?
      `;
      const result = await this.env.DB.prepare(query).bind(...bindings).run();
      if (result.success) {
        await this.addAdminLog({
          admin_id: updates.updated_by,
          action: "update_commission_plan",
          target_type: "initial_commission_plan",
          target_id: id,
          details: `更新佣金计划: ${JSON.stringify(updates)}`
        });
        return await this.getInitialCommissionPlanById(id);
      }
      throw new Error("更新佣金计划失败");
    } catch (error) {
      console.error("更新佣金计划失败:", error);
      throw error;
    }
  }
  // 删除佣金计划
  async deleteInitialCommissionPlan(id, adminId) {
    try {
      const result = await this.env.DB.prepare(
        "DELETE FROM initial_commission_plans WHERE id = ?"
      ).bind(id).run();
      if (result.success) {
        await this.addAdminLog({
          admin_id: adminId,
          action: "delete_commission_plan",
          target_type: "initial_commission_plan",
          target_id: id,
          details: `删除佣金计划 ID: ${id}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("删除佣金计划失败:", error);
      throw error;
    }
  }
  // 获取单个佣金计划
  async getInitialCommissionPlanById(id) {
    try {
      const result = await this.env.DB.prepare(
        "SELECT * FROM initial_commission_plans WHERE id = ?"
      ).bind(id).first();
      if (result && result.trigger_condition) {
        result.trigger_condition = JSON.parse(result.trigger_condition);
      }
      return result;
    } catch (error) {
      console.error("获取佣金计划失败:", error);
      return null;
    }
  }
  // 获取单个佣金计划（别名方法）
  async getInitialCommissionPlan(id) {
    return this.getInitialCommissionPlanById(id);
  }
  // 获取用户佣金配置列表
  async getUserInitialCommissionConfigs(params = {}) {
    const { page = 1, pageSize = 10, search, status, planId } = params;
    const offset = (page - 1) * pageSize;
    try {
      const whereClauses = [];
      const bindings = [];
      whereClauses.push("u.role = ?");
      bindings.push("creator");
      if (search) {
        whereClauses.push("(u.username LIKE ? OR u.email LIKE ?)");
        bindings.push(`%${search}%`, `%${search}%`);
      }
      if (status && status !== "all") {
        if (status === "active") {
          whereClauses.push("uicc.is_active = ?");
          bindings.push(true);
        } else if (status === "inactive") {
          whereClauses.push("uicc.is_active = ?");
          bindings.push(false);
        }
      }
      if (planId) {
        whereClauses.push("EXISTS (SELECT 1 FROM initial_commission_plan_users icpu WHERE icpu.user_id = u.id AND icpu.plan_id = ?)");
        bindings.push(planId);
      }
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total 
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        ${whereClause}
      `;
      const countResult = await this.env.DB.prepare(countQuery).bind(...bindings).first();
      const total = countResult?.total || 0;
      const dataQuery = `
        SELECT DISTINCT 
          u.id, u.username, u.email, u.avatar_url, u.created_at as user_created_at,
          uicc.is_active as commission_status,
          uicc.created_at as config_created_at, uicc.updated_at as config_updated_at
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        ${whereClause}
        ORDER BY u.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const results = await this.env.DB.prepare(dataQuery).bind(...bindings, pageSize, offset).all();
      return {
        items: results.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("获取用户佣金配置列表失败:", error);
      throw error;
    }
  }
  // 获取用户佣金配置及发放进度
  async getUserInitialCommissionWithPayouts(params = {}) {
    const { page = 1, pageSize = 10, search, status, planId } = params;
    const offset = (page - 1) * pageSize;
    try {
      const whereClauses = [];
      const bindings = [];
      whereClauses.push("u.role = ?");
      bindings.push("creator");
      if (search) {
        whereClauses.push("(u.username LIKE ? OR u.email LIKE ?)");
        bindings.push(`%${search}%`, `%${search}%`);
      }
      if (status && status !== "all") {
        if (status === "active") {
          whereClauses.push("uicc.is_active = ?");
          bindings.push(true);
        } else if (status === "inactive") {
          whereClauses.push("uicc.is_active = ?");
          bindings.push(false);
        }
      }
      if (planId) {
        whereClauses.push("EXISTS (SELECT 1 FROM initial_commission_plan_users icpu WHERE icpu.user_id = u.id AND icpu.plan_id = ?)");
        bindings.push(planId);
      }
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total 
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        ${whereClause}
      `;
      const countResult = await this.env.DB.prepare(countQuery).bind(...bindings).first();
      const total = countResult?.total || 0;
      const dataQuery = `
        SELECT DISTINCT 
          u.id, u.username, u.email, u.avatar_url, u.created_at as user_created_at,
          uicc.is_active as commission_status,
          uicc.created_at as config_created_at, uicc.updated_at as config_updated_at,
          -- 佣金计划信息
          icp.id as plan_id, icp.name as plan_name, icp.fixed_amount, icp.payout_cycle,
          -- 发放进度统计
          (
            SELECT COUNT(*) 
            FROM initial_commission_payouts icp_total 
            WHERE icp_total.user_id = u.id
          ) as total_payouts,
          (
            SELECT COUNT(*) 
            FROM initial_commission_payouts icp_completed 
            WHERE icp_completed.user_id = u.id AND icp_completed.status = 'completed'
          ) as completed_payouts,
          (
            SELECT SUM(amount) 
            FROM initial_commission_payouts icp_paid 
            WHERE icp_paid.user_id = u.id AND icp_paid.status = 'completed'
          ) as total_paid_amount,
          -- 下次发放日期
          (
            SELECT MIN(scheduled_date) 
            FROM initial_commission_payouts icp_next 
            WHERE icp_next.user_id = u.id AND icp_next.status = 'pending'
          ) as next_payout_date,
          -- 待发放金额
          (
            SELECT SUM(amount) 
            FROM initial_commission_payouts icp_pending 
            WHERE icp_pending.user_id = u.id AND icp_pending.status = 'pending'
          ) as pending_amount
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        LEFT JOIN initial_commission_plans icp ON uicc.plan_id = icp.id
        ${whereClause}
        ORDER BY u.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const results = await this.env.DB.prepare(dataQuery).bind(...bindings, pageSize, offset).all();
      return {
        items: results.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("获取用户佣金配置及发放进度失败:", error);
      throw error;
    }
  }
  // 更新用户佣金状态
  async updateUserCommissionStatus(userId, isActive, adminId) {
    try {
      const existingConfig = await this.env.DB.prepare(
        "SELECT id, plan_id, fixed_amount, payout_cycle FROM user_initial_commission_configs WHERE user_id = ?"
      ).bind(userId).first();
      let result;
      let planIds = [];
      let commissionAmount = 0;
      let payoutCycle = 30;
      if (isActive) {
        const eligiblePlansResult = await this.getEligibleCommissionPlansForUser(userId);
        planIds = eligiblePlansResult.eligiblePlans.map((plan) => plan.id);
        console.log(`用户 ${userId} 符合的计划ID:`, planIds);
        if (planIds.length > 0) {
          const planInfo = await this.getInitialCommissionPlanById(planIds[0]);
          if (planInfo) {
            commissionAmount = planInfo.fixed_amount || 0;
            payoutCycle = planInfo.payout_cycle || 30;
          }
        }
      }
      if (existingConfig) {
        if (isActive && planIds.length > 0) {
          result = await this.env.DB.prepare(
            `UPDATE user_initial_commission_configs SET 
             is_active = ?, plan_id = ?, fixed_amount = ?, payout_cycle = ?, 
             next_payout_date = date('now', '+' || ? || ' days'),
             activated_at = datetime('now'), activated_by = ?,
             updated_at = datetime('now') 
             WHERE user_id = ?`
          ).bind(isActive, planIds[0], commissionAmount, payoutCycle, payoutCycle, adminId, userId).run();
        } else {
          result = await this.env.DB.prepare(
            "UPDATE user_initial_commission_configs SET is_active = ?, deactivated_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"
          ).bind(isActive, userId).run();
        }
      } else {
        const planId = isActive && planIds.length > 0 ? planIds[0] : null;
        const nextPayoutDate = isActive ? `date('now', '+${payoutCycle} days')` : null;
        result = await this.env.DB.prepare(
          `INSERT INTO user_initial_commission_configs 
           (user_id, is_active, plan_id, fixed_amount, payout_cycle, next_payout_date, 
            total_received, payout_count, workflow_count, activated_at, activated_by, created_at) 
           VALUES (?, ?, ?, ?, ?, ${nextPayoutDate}, 0, 0, 0, datetime('now'), ?, datetime('now'))`
        ).bind(userId, isActive, planId, commissionAmount, payoutCycle, adminId).run();
      }
      if (result.success) {
        if (isActive && planIds.length > 0 && commissionAmount > 0) {
          await this.createCommissionDistributionRecords(userId, planIds[0], commissionAmount, payoutCycle, adminId, "管理员启用用户佣金");
        }
        if (isActive && planIds.length > 1) {
          for (let i = 1; i < planIds.length; i++) {
            await this.assignCommissionPlanToUser(planIds[i], userId, adminId);
          }
        }
        const planInfo = planIds.length > 0 ? ` (分配计划ID: ${planIds.join(", ")}, 佣金金额: ${commissionAmount})` : "";
        await this.addAdminLog({
          admin_id: adminId,
          action: "update_user_commission_status",
          target_type: "user_commission_config",
          target_id: userId,
          details: `更新用户 ${userId} 佣金状态为: ${isActive ? "active" : "inactive"} (is_active: ${isActive})${planInfo}`
        });
        return {
          success: true,
          user: { is_active: isActive },
          message: `用户佣金状态更新成功${planInfo}${isActive && commissionAmount > 0 ? "，已创建佣金分配记录" : ""}`
        };
      }
      return {
        success: false,
        user: { is_active: !isActive },
        message: "更新用户佣金状态失败"
      };
    } catch (error) {
      console.error("更新用户佣金状态失败:", error);
      return {
        success: false,
        user: { is_active: !isActive },
        message: error instanceof Error ? error.message : "更新用户佣金状态失败"
      };
    }
  }
  // 创建佣金发放记录
  async createCommissionPayout(userId, planId, amount, payoutType, adminId, triggerReason) {
    try {
      const config2 = await this.env.DB.prepare(
        "SELECT id FROM user_initial_commission_configs WHERE user_id = ?"
      ).bind(userId).first();
      if (!config2) {
        console.error("用户佣金配置不存在:", userId);
        return false;
      }
      const payoutResult = await this.env.DB.prepare(
        `INSERT INTO initial_commission_payouts 
         (user_id, config_id, plan_id, amount, payout_type, trigger_reason, 
          scheduled_date, actual_payout_date, status, processed_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, date('now'), date('now'), 'completed', ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))`
      ).bind(userId, config2.id, planId, amount, payoutType, triggerReason || "管理员手动发放", adminId).run();
      if (payoutResult.success) {
        await this.env.DB.prepare(
          `UPDATE user_initial_commission_configs 
           SET total_received = total_received + ?, payout_count = payout_count + 1,
               next_payout_date = date('now', '+' || payout_cycle || ' days'),
               updated_at = datetime('now')
           WHERE user_id = ?`
        ).bind(amount, userId).run();
        await this.addAdminLog({
          admin_id: adminId,
          action: "create_commission_payout",
          target_type: "payout",
          target_id: payoutResult.meta.last_row_id,
          details: `为用户 ${userId} 创建佣金发放记录，金额: ${amount}，类型: ${payoutType}`
        });
        await this.addNotification({
          user_id: userId,
          type: "commission_payout",
          title: "佣金发放通知",
          content: `您已收到佣金 ${amount} 元，发放类型: ${payoutType === "manual" ? "手动发放" : "自动发放"}`,
          related_id: payoutResult.meta.last_row_id
        });
        console.log(`成功创建用户 ${userId} 的佣金发放记录，金额: ${amount}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("创建佣金发放记录失败:", error);
      return false;
    }
  }
  // 创建佣金分配记录（根据计划创建多天的分配记录）
  async createCommissionDistributionRecords(userId, planId, totalAmount, payoutCycle, adminId, triggerReason) {
    try {
      const config2 = await this.env.DB.prepare(
        "SELECT id FROM user_initial_commission_configs WHERE user_id = ?"
      ).bind(userId).first();
      if (!config2) {
        console.error("用户佣金配置不存在:", userId);
        return false;
      }
      const plan = await this.env.DB.prepare(
        "SELECT name FROM initial_commission_plans WHERE id = ?"
      ).bind(planId).first();
      const planTitle = plan?.name || "佣金计划";
      const finalTriggerReason = triggerReason || planTitle;
      const dailyAmounts = this.generateRandomDailyAmounts(totalAmount, payoutCycle);
      const batch = [];
      const now = /* @__PURE__ */ new Date();
      for (let i = 0; i < payoutCycle; i++) {
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + i);
        const scheduledDateStr = scheduledDate.toISOString().split("T")[0];
        batch.push(
          this.env.DB.prepare(
            `INSERT INTO initial_commission_payouts 
             (user_id, config_id, plan_id, amount, payout_type, trigger_reason, 
              scheduled_date, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+8 hours'), datetime('now', '+8 hours'))`
          ).bind(
            userId,
            config2.id,
            planId,
            dailyAmounts[i],
            "scheduled",
            finalTriggerReason,
            scheduledDateStr
          )
        );
      }
      const results = await this.env.DB.batch(batch);
      const allSuccess = results.every((result) => result.success);
      if (allSuccess) {
        await this.env.DB.prepare(
          `UPDATE user_initial_commission_configs 
           SET next_payout_date = date('now'),
               updated_at = datetime('now')
           WHERE user_id = ?`
        ).bind(userId).run();
        await this.addAdminLog({
          admin_id: adminId,
          action: "create_commission_distribution",
          target_type: "payout",
          target_id: userId,
          details: `为用户 ${userId} 创建佣金分配记录，计划: ${planTitle}，总金额: ${totalAmount}，分配天数: ${payoutCycle}，每日金额: [${dailyAmounts.join(", ")}]`
        });
        console.log(`成功为用户 ${userId} 创建 ${payoutCycle} 天的佣金分配记录，总金额: ${totalAmount}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("创建佣金分配记录失败:", error);
      return false;
    }
  }
  // 生成递增式的每日佣金金额（增强用户粘性）
  generateRandomDailyAmounts(totalAmount, days) {
    if (days <= 0) return [];
    if (days === 1) return [totalAmount];
    const amounts = [];
    const basePercentages = [
      0.05,
      // 第1天：5%
      0.08,
      // 第2天：8%
      0.12,
      // 第3天：12%
      0.18,
      // 第4天：18%
      0.22,
      // 第5天：22%
      0.15,
      // 第6天：15%
      0.2
      // 第7天：20%
    ];
    let percentages;
    if (days <= 7) {
      percentages = basePercentages.slice(0, days);
    } else {
      percentages = [...basePercentages];
      const remainingPercentage = 1 - basePercentages.reduce((sum, p) => sum + p, 0);
      const extraDays = days - 7;
      const extraDayPercentage = remainingPercentage / extraDays;
      for (let i = 0; i < extraDays; i++) {
        percentages.push(extraDayPercentage);
      }
    }
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    percentages = percentages.map((p) => p / totalPercentage);
    let allocatedAmount = 0;
    for (let i = 0; i < days - 1; i++) {
      const baseAmount = totalAmount * percentages[i];
      const variation = 0.2;
      const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
      let dailyAmount = baseAmount * randomFactor;
      dailyAmount = Math.max(0.01, dailyAmount);
      dailyAmount = Math.round(dailyAmount * 100) / 100;
      amounts.push(dailyAmount);
      allocatedAmount += dailyAmount;
    }
    const lastDayAmount = Math.round((totalAmount - allocatedAmount) * 100) / 100;
    amounts.push(Math.max(0.01, lastDayAmount));
    return amounts;
  }
  // 获取佣金统计数据
  async getCommissionStats() {
    try {
      const totalUsersResult = await this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM users"
      ).first();
      const activeUsersResult = await this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM user_initial_commission_configs WHERE is_active = true"
      ).first();
      const totalPaidResult = await this.env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM initial_commission_payouts WHERE status = 'completed'"
      ).first();
      const monthlyEstimateResult = await this.env.DB.prepare(`
        SELECT COALESCE(SUM(icp.amount_value), 0) as estimate 
        FROM initial_commission_plans icp 
        JOIN initial_commission_plan_users icpu ON icp.id = icpu.plan_id 
        WHERE icp.status = 'active' AND icpu.status = 'active'
      `).first();
      return {
        totalUsers: totalUsersResult?.count || 0,
        activeUsers: activeUsersResult?.count || 0,
        totalPaid: totalPaidResult?.total || 0,
        monthlyEstimate: monthlyEstimateResult?.estimate || 0
      };
    } catch (error) {
      console.error("获取佣金统计数据失败:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPaid: 0,
        monthlyEstimate: 0
      };
    }
  }
  // 获取实时统计面板数据
  async getRealTimeStats() {
    try {
      const totalCreatorsResult = await this.env.DB.prepare(`
        SELECT COUNT(DISTINCT u.id) as count 
        FROM users u 
        JOIN coze_workflows cw ON u.id = cw.user_id 
        WHERE u.role = 'creator' AND u.status = 'active'
      `).first();
      const activePayoutsResult = await this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM user_initial_commission_configs WHERE is_active = true"
      ).first();
      const totalCommissionPaidResult = await this.env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM initial_commission_payouts WHERE status = 'completed'"
      ).first();
      const pendingCommissionResult = await this.env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM initial_commission_payouts WHERE status IN ('pending', 'processing')"
      ).first();
      const totalProcessedResult = await this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM initial_commission_payouts"
      ).first();
      const successCountResult = await this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM initial_commission_payouts WHERE status = 'completed'"
      ).first();
      const failureCountResult = await this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM initial_commission_payouts WHERE status = 'failed'"
      ).first();
      return {
        total_creators: totalCreatorsResult?.count || 0,
        active_payouts: activePayoutsResult?.count || 0,
        total_commission_paid: totalCommissionPaidResult?.total || 0,
        pending_commission: pendingCommissionResult?.total || 0,
        total_processed: totalProcessedResult?.count || 0,
        success_count: successCountResult?.count || 0,
        failure_count: failureCountResult?.count || 0
      };
    } catch (error) {
      console.error("获取实时统计数据失败:", error);
      return {
        total_creators: 0,
        active_payouts: 0,
        total_commission_paid: 0,
        pending_commission: 0,
        total_processed: 0,
        success_count: 0,
        failure_count: 0
      };
    }
  }
  // 为用户分配佣金计划
  async assignCommissionPlanToUser(planId, userId, adminId) {
    try {
      const existing = await this.env.DB.prepare(
        "SELECT id FROM initial_commission_plan_users WHERE plan_id = ? AND user_id = ?"
      ).bind(planId, userId).first();
      if (existing) {
        return false;
      }
      const result = await this.env.DB.prepare(
        "INSERT INTO initial_commission_plan_users (plan_id, user_id, status, assigned_at) VALUES (?, ?, 'active', datetime('now'))"
      ).bind(planId, userId).run();
      if (result.success) {
        await this.addAdminLog({
          admin_id: adminId,
          action: "assign_commission_plan",
          target_type: "commission_plan_assignment",
          target_id: result.meta.last_row_id,
          details: `为用户 ${userId} 分配佣金计划 ${planId}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("分配佣金计划失败:", error);
      throw error;
    }
  }
  // 移除用户的佣金计划
  async removeCommissionPlanFromUser(planId, userId, adminId) {
    try {
      const result = await this.env.DB.prepare(
        "DELETE FROM initial_commission_plan_users WHERE plan_id = ? AND user_id = ?"
      ).bind(planId, userId).run();
      if (result.success) {
        await this.addAdminLog({
          admin_id: adminId,
          action: "remove_commission_plan",
          target_type: "commission_plan_assignment",
          target_id: userId,
          details: `移除用户 ${userId} 的佣金计划 ${planId}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("移除佣金计划失败:", error);
      throw error;
    }
  }
  // 检查用户是否符合初始佣金计划条件并获取符合条件的计划ID
  async getEligibleCommissionPlansForUser(userId) {
    try {
      const userWorkflowResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as workflow_count FROM coze_workflows WHERE creator_id = ? AND status = "online"'
      ).bind(userId).first();
      const userWorkflowCount = userWorkflowResult?.workflow_count || 0;
      const plansResult = await this.env.DB.prepare(
        "SELECT * FROM initial_commission_plans WHERE is_active = true ORDER BY created_at DESC"
      ).all();
      const eligiblePlans = [];
      for (const plan of plansResult.results || []) {
        let isEligible = false;
        let reason = "";
        if (plan.trigger_type === "manual") {
          isEligible = true;
          reason = "手动触发计划，符合条件";
        } else if (plan.trigger_type === "workflow_threshold" && plan.workflow_threshold) {
          if (userWorkflowCount >= plan.workflow_threshold) {
            isEligible = true;
            reason = `用户工作流数量(${userWorkflowCount})达到阈值(${plan.workflow_threshold})`;
          } else {
            reason = `用户工作流数量(${userWorkflowCount})未达到阈值(${plan.workflow_threshold})`;
          }
        }
        if (isEligible && plan.target_user_type === "specific") {
          const assignmentResult = await this.env.DB.prepare(
            "SELECT id FROM initial_commission_plan_users WHERE plan_id = ? AND user_id = ?"
          ).bind(plan.id, userId).first();
          if (!assignmentResult) {
            isEligible = false;
            reason = "用户未被分配到此特定计划";
          }
        }
        if (isEligible) {
          eligiblePlans.push({
            id: plan.id,
            name: plan.name,
            fixed_amount: plan.fixed_amount,
            payout_cycle: plan.payout_cycle,
            trigger_type: plan.trigger_type,
            workflow_threshold: plan.workflow_threshold,
            reason
          });
        }
      }
      return {
        eligiblePlans,
        userWorkflowCount
      };
    } catch (error) {
      console.error("检查用户佣金计划资格失败:", error);
      throw error;
    }
  }
}
var define_process_env_default = {};
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var version = "4.7.0";
var ApiKeys = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      const data = yield this.resend.post(
        "/api-keys",
        payload,
        options
      );
      return data;
    });
  }
  list() {
    return __async(this, null, function* () {
      const data = yield this.resend.get("/api-keys");
      return data;
    });
  }
  remove(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.delete(
        `/api-keys/${id}`
      );
      return data;
    });
  }
};
var Audiences = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      const data = yield this.resend.post(
        "/audiences",
        payload,
        options
      );
      return data;
    });
  }
  list() {
    return __async(this, null, function* () {
      const data = yield this.resend.get("/audiences");
      return data;
    });
  }
  get(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.get(
        `/audiences/${id}`
      );
      return data;
    });
  }
  remove(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.delete(
        `/audiences/${id}`
      );
      return data;
    });
  }
};
function parseEmailToApiOptions(email) {
  return {
    attachments: email.attachments,
    bcc: email.bcc,
    cc: email.cc,
    from: email.from,
    headers: email.headers,
    html: email.html,
    reply_to: email.replyTo,
    scheduled_at: email.scheduledAt,
    subject: email.subject,
    tags: email.tags,
    text: email.text,
    to: email.to
  };
}
var Batch = class {
  constructor(resend) {
    this.resend = resend;
  }
  send(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      return this.create(payload, options);
    });
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      const emails = [];
      for (const email of payload) {
        if (email.react) {
          if (!this.renderAsync) {
            try {
              const { renderAsync } = yield import("./assets/index-BT7auFWZ.js").then((n) => n.i);
              this.renderAsync = renderAsync;
            } catch (error) {
              throw new Error(
                "Failed to render React component. Make sure to install `@react-email/render`"
              );
            }
          }
          email.html = yield this.renderAsync(email.react);
          email.react = void 0;
        }
        emails.push(parseEmailToApiOptions(email));
      }
      const data = yield this.resend.post(
        "/emails/batch",
        emails,
        options
      );
      return data;
    });
  }
};
var Broadcasts = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      if (payload.react) {
        if (!this.renderAsync) {
          try {
            const { renderAsync } = yield import("./assets/index-BT7auFWZ.js").then((n) => n.i);
            this.renderAsync = renderAsync;
          } catch (error) {
            throw new Error(
              "Failed to render React component. Make sure to install `@react-email/render`"
            );
          }
        }
        payload.html = yield this.renderAsync(
          payload.react
        );
      }
      const data = yield this.resend.post(
        "/broadcasts",
        {
          name: payload.name,
          audience_id: payload.audienceId,
          preview_text: payload.previewText,
          from: payload.from,
          html: payload.html,
          reply_to: payload.replyTo,
          subject: payload.subject,
          text: payload.text
        },
        options
      );
      return data;
    });
  }
  send(id, payload) {
    return __async(this, null, function* () {
      const data = yield this.resend.post(
        `/broadcasts/${id}/send`,
        { scheduled_at: payload == null ? void 0 : payload.scheduledAt }
      );
      return data;
    });
  }
  list() {
    return __async(this, null, function* () {
      const data = yield this.resend.get("/broadcasts");
      return data;
    });
  }
  get(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.get(
        `/broadcasts/${id}`
      );
      return data;
    });
  }
  remove(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.delete(
        `/broadcasts/${id}`
      );
      return data;
    });
  }
  update(id, payload) {
    return __async(this, null, function* () {
      const data = yield this.resend.patch(
        `/broadcasts/${id}`,
        {
          name: payload.name,
          audience_id: payload.audienceId,
          from: payload.from,
          html: payload.html,
          text: payload.text,
          subject: payload.subject,
          reply_to: payload.replyTo,
          preview_text: payload.previewText
        }
      );
      return data;
    });
  }
};
var Contacts = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      const data = yield this.resend.post(
        `/audiences/${payload.audienceId}/contacts`,
        {
          unsubscribed: payload.unsubscribed,
          email: payload.email,
          first_name: payload.firstName,
          last_name: payload.lastName
        },
        options
      );
      return data;
    });
  }
  list(options) {
    return __async(this, null, function* () {
      const data = yield this.resend.get(
        `/audiences/${options.audienceId}/contacts`
      );
      return data;
    });
  }
  get(options) {
    return __async(this, null, function* () {
      if (!options.id && !options.email) {
        return {
          data: null,
          error: {
            message: "Missing `id` or `email` field.",
            name: "missing_required_field"
          }
        };
      }
      const data = yield this.resend.get(
        `/audiences/${options.audienceId}/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`
      );
      return data;
    });
  }
  update(payload) {
    return __async(this, null, function* () {
      if (!payload.id && !payload.email) {
        return {
          data: null,
          error: {
            message: "Missing `id` or `email` field.",
            name: "missing_required_field"
          }
        };
      }
      const data = yield this.resend.patch(
        `/audiences/${payload.audienceId}/contacts/${(payload == null ? void 0 : payload.email) ? payload == null ? void 0 : payload.email : payload == null ? void 0 : payload.id}`,
        {
          unsubscribed: payload.unsubscribed,
          first_name: payload.firstName,
          last_name: payload.lastName
        }
      );
      return data;
    });
  }
  remove(payload) {
    return __async(this, null, function* () {
      if (!payload.id && !payload.email) {
        return {
          data: null,
          error: {
            message: "Missing `id` or `email` field.",
            name: "missing_required_field"
          }
        };
      }
      const data = yield this.resend.delete(
        `/audiences/${payload.audienceId}/contacts/${(payload == null ? void 0 : payload.email) ? payload == null ? void 0 : payload.email : payload == null ? void 0 : payload.id}`
      );
      return data;
    });
  }
};
function parseDomainToApiOptions(domain2) {
  return {
    name: domain2.name,
    region: domain2.region,
    custom_return_path: domain2.customReturnPath
  };
}
var Domains = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      const data = yield this.resend.post(
        "/domains",
        parseDomainToApiOptions(payload),
        options
      );
      return data;
    });
  }
  list() {
    return __async(this, null, function* () {
      const data = yield this.resend.get("/domains");
      return data;
    });
  }
  get(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.get(
        `/domains/${id}`
      );
      return data;
    });
  }
  update(payload) {
    return __async(this, null, function* () {
      const data = yield this.resend.patch(
        `/domains/${payload.id}`,
        {
          click_tracking: payload.clickTracking,
          open_tracking: payload.openTracking,
          tls: payload.tls
        }
      );
      return data;
    });
  }
  remove(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.delete(
        `/domains/${id}`
      );
      return data;
    });
  }
  verify(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.post(
        `/domains/${id}/verify`
      );
      return data;
    });
  }
};
var Emails = class {
  constructor(resend) {
    this.resend = resend;
  }
  send(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      return this.create(payload, options);
    });
  }
  create(_0) {
    return __async(this, arguments, function* (payload, options = {}) {
      if (payload.react) {
        if (!this.renderAsync) {
          try {
            const { renderAsync } = yield import("./assets/index-BT7auFWZ.js").then((n) => n.i);
            this.renderAsync = renderAsync;
          } catch (error) {
            throw new Error(
              "Failed to render React component. Make sure to install `@react-email/render`"
            );
          }
        }
        payload.html = yield this.renderAsync(
          payload.react
        );
      }
      const data = yield this.resend.post(
        "/emails",
        parseEmailToApiOptions(payload),
        options
      );
      return data;
    });
  }
  get(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.get(
        `/emails/${id}`
      );
      return data;
    });
  }
  update(payload) {
    return __async(this, null, function* () {
      const data = yield this.resend.patch(
        `/emails/${payload.id}`,
        {
          scheduled_at: payload.scheduledAt
        }
      );
      return data;
    });
  }
  cancel(id) {
    return __async(this, null, function* () {
      const data = yield this.resend.post(
        `/emails/${id}/cancel`
      );
      return data;
    });
  }
};
var defaultBaseUrl = "https://api.resend.com";
var defaultUserAgent = `resend-node:${version}`;
var baseUrl = typeof process !== "undefined" && define_process_env_default ? define_process_env_default.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
var userAgent = typeof process !== "undefined" && define_process_env_default ? define_process_env_default.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
  constructor(key) {
    this.key = key;
    this.apiKeys = new ApiKeys(this);
    this.audiences = new Audiences(this);
    this.batch = new Batch(this);
    this.broadcasts = new Broadcasts(this);
    this.contacts = new Contacts(this);
    this.domains = new Domains(this);
    this.emails = new Emails(this);
    if (!key) {
      if (typeof process !== "undefined" && define_process_env_default) {
        this.key = define_process_env_default.RESEND_API_KEY;
      }
      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new Resend("re_123")`'
        );
      }
    }
    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json"
    });
  }
  fetchRequest(_0) {
    return __async(this, arguments, function* (path, options = {}) {
      try {
        const response = yield fetch(`${baseUrl}${path}`, options);
        if (!response.ok) {
          try {
            const rawError = yield response.text();
            return { data: null, error: JSON.parse(rawError) };
          } catch (err) {
            if (err instanceof SyntaxError) {
              return {
                data: null,
                error: {
                  name: "application_error",
                  message: "Internal server error. We are unable to process your request right now, please try again later."
                }
              };
            }
            const error = {
              message: response.statusText,
              name: "application_error"
            };
            if (err instanceof Error) {
              return { data: null, error: __spreadProps(__spreadValues({}, error), { message: err.message }) };
            }
            return { data: null, error };
          }
        }
        const data = yield response.json();
        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: {
            name: "application_error",
            message: "Unable to fetch data. The request could not be resolved."
          }
        };
      }
    });
  }
  post(_0, _1) {
    return __async(this, arguments, function* (path, entity, options = {}) {
      const headers = new Headers(this.headers);
      if (options.idempotencyKey) {
        headers.set("Idempotency-Key", options.idempotencyKey);
      }
      const requestOptions = __spreadValues({
        method: "POST",
        headers,
        body: JSON.stringify(entity)
      }, options);
      return this.fetchRequest(path, requestOptions);
    });
  }
  get(_0) {
    return __async(this, arguments, function* (path, options = {}) {
      const requestOptions = __spreadValues({
        method: "GET",
        headers: this.headers
      }, options);
      return this.fetchRequest(path, requestOptions);
    });
  }
  put(_0, _1) {
    return __async(this, arguments, function* (path, entity, options = {}) {
      const requestOptions = __spreadValues({
        method: "PUT",
        headers: this.headers,
        body: JSON.stringify(entity)
      }, options);
      return this.fetchRequest(path, requestOptions);
    });
  }
  patch(_0, _1) {
    return __async(this, arguments, function* (path, entity, options = {}) {
      const requestOptions = __spreadValues({
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify(entity)
      }, options);
      return this.fetchRequest(path, requestOptions);
    });
  }
  delete(path, query) {
    return __async(this, null, function* () {
      const requestOptions = {
        method: "DELETE",
        headers: this.headers,
        body: JSON.stringify(query)
      };
      return this.fetchRequest(path, requestOptions);
    });
  }
};
class AuthService {
  constructor(env2, db) {
    this.env = env2;
    this.db = db;
  }
  // 生成6位数验证码
  generateVerificationCode() {
    return Math.floor(1e5 + Math.random() * 9e5).toString();
  }
  // 发送邮件的函数
  async sendEmail(to, subject, html) {
    try {
      if (!this.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY未配置");
        return false;
      }
      const resend = new Resend(this.env.RESEND_API_KEY);
      console.log("准备发送真实邮件:", {
        from: "工作流分享平台 <noreply@chaofengq.com>",
        to,
        subject
      });
      const { data, error } = await resend.emails.send({
        from: "工作流分享平台 <noreply@chaofengq.com>",
        to,
        subject,
        html
      });
      if (error) {
        console.error("Resend邮件发送失败:", error);
        return false;
      }
      console.log("邮件发送成功:", data);
      return true;
    } catch (error) {
      console.error("邮件发送异常:", error);
      return false;
    }
  }
  // 发送通知邮件（公共方法）
  async sendNotificationEmail(to, subject, html) {
    return await this.sendEmail(to, subject, html);
  }
  // 发送邮箱验证码
  async sendEmailVerificationCode(email) {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          code: 400,
          message: "邮箱格式不正确",
          error: {
            field: "email",
            reason: "请输入有效的邮箱地址"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        return {
          success: false,
          code: 400,
          message: "邮箱已被注册",
          error: {
            field: "email",
            reason: "该邮箱已被其他用户使用"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const code = this.generateVerificationCode();
      await this.db.createEmailVerificationCode(email, code);
      const emailSubject = "工作流分享平台 - 邮箱验证码";
      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; line-height: 60px; color: white; font-size: 24px; font-weight: bold;">WF</div>
            <h1 style="color: #333; margin: 20px 0 10px 0;">工作流分享平台</h1>
            <p style="color: #666; margin: 0;">您的邮箱验证码</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <h2 style="color: #333; margin: 0 0 15px 0;">验证码</h2>
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0;">${code}</div>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">验证码有效期为10分钟</p>
          </div>
          
          <div style="color: #666; font-size: 14px; line-height: 1.6;">
            <p>您正在注册工作流分享平台账户，请在注册页面输入上述验证码完成邮箱验证。</p>
            <p>如果您没有进行此操作，请忽略此邮件。</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© 2024 工作流分享平台. All rights reserved.</p>
          </div>
        </div>
      `;
      const emailSent = await this.sendEmail(email, emailSubject, emailHtml);
      if (!emailSent) {
        return {
          success: false,
          code: 500,
          message: "邮件发送失败",
          error: {
            reason: "邮件服务暂时不可用，请稍后重试"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return {
        success: true,
        code: 200,
        message: "验证码已发送",
        data: {
          // 在开发环境中返回验证码，生产环境中不应该返回
          ...this.env.ENVIRONMENT === "development" && { verificationCode: code }
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Send email verification code error:", error);
      return {
        success: false,
        code: 500,
        message: "发送验证码失败",
        error: {
          reason: "服务器内部错误"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  // 验证邮箱验证码
  async verifyEmailCode(email, code) {
    try {
      console.log("Starting email code verification:", { email, code });
      const verificationRecord = await this.db.getEmailVerificationCode(email, code);
      console.log("Verification record found:", !!verificationRecord);
      if (!verificationRecord) {
        console.log("No verification record found - checking all codes for this email");
        const allCodes = await this.db.getAllEmailVerificationCodes(email);
        console.log("All verification codes for email:", allCodes);
        return {
          success: false,
          code: 400,
          message: "验证码无效或已过期",
          error: {
            field: "code",
            reason: "请检查验证码是否正确或重新获取"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.log("Verification successful, marking code as used");
      await this.db.markEmailVerificationCodeAsUsed(email, code);
      return {
        success: true,
        code: 200,
        message: "邮箱验证成功",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Verify email code error:", error);
      return {
        success: false,
        code: 500,
        message: "验证失败",
        error: {
          reason: "服务器内部错误"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  // 生成JWT Token
  async generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60,
      // 24小时过期
      iat: Math.floor(Date.now() / 1e3)
    };
    return await this.signJWT(payload, this.env.JWT_SECRET);
  }
  // 验证JWT Token
  async verifyToken(token) {
    try {
      const payload = await this.verifyJWT(token, this.env.JWT_SECRET);
      if (payload.exp < Math.floor(Date.now() / 1e3)) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }
  // JWT签名函数（使用Web Crypto API）
  async signJWT(payload, secret) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.hmacSign(data, secret);
    return `${data}.${signature}`;
  }
  // JWT验证函数（使用Web Crypto API）
  async verifyJWT(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await this.hmacSign(data, secret);
    if (signature !== expectedSignature) {
      throw new Error("Invalid JWT signature");
    }
    return JSON.parse(this.base64UrlDecode(encodedPayload));
  }
  // HMAC签名
  async hmacSign(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
    return this.base64UrlEncode(new Uint8Array(signature));
  }
  // Base64 URL编码
  base64UrlEncode(data) {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
  // Base64 URL解码
  base64UrlDecode(data) {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
    return atob(padded);
  }
  // 从请求头中提取token
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }
  // 验证用户权限
  async verifyPermission(token, requiredRoles = []) {
    const payload = await this.verifyToken(token);
    if (!payload) return null;
    const user = await this.db.getUserById(payload.userId);
    if (!user || user.status !== "active") return null;
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return null;
    }
    return { user, payload };
  }
  // 密码哈希（使用Web Crypto API）
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // 验证密码
  async verifyPassword(password, hashedPassword) {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }
  // 用户注册（需要先验证邮箱）
  async register(username, email, password, verificationCode, role = "user") {
    try {
      console.log("Register attempt:", { username, email, role, hasVerificationCode: !!verificationCode });
      console.log("Verifying email code for:", email);
      const codeVerification = await this.verifyEmailCode(email, verificationCode);
      if (!codeVerification.success) {
        console.log("Email code verification failed:", codeVerification);
        return codeVerification;
      }
      console.log("Email code verification successful");
      console.log("Checking username availability:", username);
      const existingUserByUsername = await this.db.getUserByUsername(username);
      if (existingUserByUsername) {
        console.log("Username already exists:", username);
        return {
          success: false,
          code: 400,
          message: "用户名已存在",
          error: {
            field: "username",
            reason: "该用户名已被使用"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.log("Checking email availability:", email);
      const existingUserByEmail = await this.db.getUserByEmail(email);
      if (existingUserByEmail) {
        console.log("Email already exists:", email);
        return {
          success: false,
          code: 400,
          message: "邮箱已存在",
          error: {
            field: "email",
            reason: "该邮箱已被注册"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.log("Validating password strength, length:", password.length);
      if (password.length < 6) {
        console.log("Password too short:", password.length);
        return {
          success: false,
          code: 400,
          message: "密码强度不足",
          error: {
            field: "password",
            reason: "密码长度至少6位"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.log("Creating user with role:", role);
      const hashedPassword = await this.hashPassword(password);
      const newUser = await this.db.createUser({
        username,
        email,
        password_hash: hashedPassword,
        role,
        balance: 0,
        total_earnings: 0,
        status: "active"
      });
      console.log("User created successfully:", { id: newUser.id, username: newUser.username });
      const token = await this.generateToken(newUser);
      const { password_hash: _, ...userWithoutPassword } = newUser;
      return {
        success: true,
        code: 200,
        message: "注册成功",
        data: {
          user: userWithoutPassword,
          token
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        code: 500,
        message: "注册失败",
        error: {
          reason: "服务器内部错误"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  // 用户登录
  async login(email, password) {
    try {
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          code: 401,
          message: "登录失败",
          error: {
            field: "email",
            reason: "用户不存在"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      if (user.status !== "active") {
        let message = "登录失败";
        let reason = "请联系管理员";
        switch (user.status) {
          case "banned":
            message = "账户已被封禁";
            reason = "此账号已被系统封禁，如有疑问请联系管理员";
            break;
          case "suspended":
            message = "账户已被暂停";
            reason = "此账号已被暂停使用，请联系管理员";
            break;
          case "pending":
            message = "账户待激活";
            reason = "请先完成邮箱验证激活账户";
            break;
          case "deleted":
            message = "账户不存在";
            reason = "此账号已被删除";
            break;
          default:
            message = "账户状态异常";
            reason = "请联系管理员";
        }
        return {
          success: false,
          code: 401,
          message,
          error: {
            reason
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const isPasswordValid = await this.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          code: 401,
          message: "登录失败",
          error: {
            field: "password",
            reason: "密码错误"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const updatedUser = await this.db.updateUser(user.id, {});
      const token = await this.generateToken(updatedUser || user);
      return {
        success: true,
        code: 200,
        message: "登录成功",
        data: {
          user: updatedUser || user,
          token
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        message: "登录失败",
        error: {
          reason: "服务器内部错误"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  // GitHub OAuth认证
  async authenticateWithGitHub(code, redirectUri) {
    try {
      const redirect_uri = redirectUri || `https://www.chaofengq.com/auth/github/callback`;
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: this.env.GITHUB_CLIENT_ID,
          client_secret: this.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri
        })
      });
      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        console.error("GitHub OAuth token exchange failed:", tokenData);
        return null;
      }
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `token ${tokenData.access_token}`,
          "User-Agent": "WorkflowPlatform"
        }
      });
      const userData = await userResponse.json();
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `token ${tokenData.access_token}`,
          "User-Agent": "WorkflowPlatform"
        }
      });
      const emailData = await emailResponse.json();
      const primaryEmail = emailData.find((email) => email.primary)?.email || userData.email;
      return {
        id: userData.id.toString(),
        email: primaryEmail,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        provider: "github"
      };
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      return null;
    }
  }
  // Google OAuth认证
  async authenticateWithGoogle(code, redirectUri) {
    try {
      const redirect_uri = redirectUri || `https://www.chaofengq.com/auth/google/callback`;
      console.log("Google OAuth - Starting authentication with code:", code.substring(0, 10) + "...");
      console.log("Google OAuth - Redirect URI:", redirect_uri);
      if (!this.env.GOOGLE_CLIENT_ID || !this.env.GOOGLE_CLIENT_SECRET) {
        console.error("Google OAuth - Missing environment variables");
        return null;
      }
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.env.GOOGLE_CLIENT_ID,
          client_secret: this.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri
        })
      });
      console.log("Google OAuth - Token response status:", tokenResponse.status);
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Google OAuth - Token exchange failed:", errorText);
        return null;
      }
      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return null;
      }
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });
      console.log("Google OAuth - User info response status:", userResponse.status);
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("Google OAuth - User info fetch failed:", errorText);
        return null;
      }
      const userData = await userResponse.json();
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.picture,
        provider: "google"
      };
    } catch (error) {
      return null;
    }
  }
  // 微信OAuth认证
  async authenticateWithWechat(code) {
    try {
      console.log("WeChat OAuth - Starting authentication with code:", code);
      const WECHAT_CONFIG = {
        appid: this.env.WECHAT_APP_ID || "wx3cb32b212d933aa0",
        // 网站应用APPID
        secret: this.env.WECHAT_APP_SECRET || "88343d86d1ed09caece4c18eb765fd35"
        // 网站应用AppSecret
      };
      const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_CONFIG.appid}&secret=${WECHAT_CONFIG.secret}&code=${code}&grant_type=authorization_code`;
      const tokenResponse = await fetch(tokenUrl);
      console.log("WeChat OAuth - Token response status:", tokenResponse.status);
      if (!tokenResponse.ok) {
        console.error("WeChat OAuth - Token request failed:", tokenResponse.statusText);
        return null;
      }
      const tokenData = await tokenResponse.json();
      console.log("WeChat OAuth - Token data received:", {
        has_access_token: !!tokenData.access_token,
        has_openid: !!tokenData.openid,
        expires_in: tokenData.expires_in
      });
      if (!tokenData.access_token || !tokenData.openid) {
        console.error("WeChat OAuth - Missing access_token or openid:", tokenData);
        return null;
      }
      const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
      const userResponse = await fetch(userInfoUrl);
      console.log("WeChat OAuth - User info response status:", userResponse.status);
      if (!userResponse.ok) {
        console.error("WeChat OAuth - User info request failed:", userResponse.statusText);
        return null;
      }
      const userData = await userResponse.json();
      console.log("WeChat OAuth - User data received:", {
        has_openid: !!userData.openid,
        has_nickname: !!userData.nickname,
        has_headimgurl: !!userData.headimgurl
      });
      if (!userData.openid) {
        console.error("WeChat OAuth - Missing openid in user data:", userData);
        return null;
      }
      return {
        id: userData.openid,
        email: "null",
        // 生成虚拟邮箱
        name: userData.nickname || "微信用户",
        avatar_url: userData.headimgurl,
        provider: "wechat",
        openid: userData.openid
      };
    } catch (error) {
      console.error("WeChat OAuth - Authentication error:", error);
      return null;
    }
  }
  // OAuth注册/登录
  async oauthRegister(provider, code, role = "user", redirectUri) {
    try {
      console.log(`OAuth Register - Starting ${provider} authentication for role: ${role}`);
      let oauthUser = null;
      if (provider === "github") {
        oauthUser = await this.authenticateWithGitHub(code, redirectUri);
      } else if (provider === "google") {
        oauthUser = await this.authenticateWithGoogle(code, redirectUri);
      } else if (provider === "wechat") {
        oauthUser = await this.authenticateWithWechat(code);
      }
      if (!oauthUser) {
        console.error(`OAuth Register - Failed to get ${provider} user info`);
        return {
          success: false,
          code: 400,
          message: "OAuth认证失败",
          error: {
            reason: "无法获取用户信息"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.log(`OAuth Register - Got user info for: ${oauthUser.email}`);
      let existingUser = await this.db.getUserByOAuth(oauthUser.provider, oauthUser.id);
      if (!existingUser) {
        existingUser = await this.db.getUserByEmail(oauthUser.email);
      }
      if (existingUser) {
        console.log("OAuth Register - Found existing user:", existingUser.id);
        if (existingUser.status !== "active") {
          let message = "登录失败";
          let reason = "请联系管理员";
          switch (existingUser.status) {
            case "banned":
              message = "账户已被封禁";
              reason = "此账号已被系统封禁，如有疑问请联系管理员";
              break;
            case "suspended":
              message = "账户已被暂停";
              reason = "此账号已被暂停使用，请联系管理员";
              break;
            case "pending":
              message = "账户待激活";
              reason = "请先完成邮箱验证激活账户";
              break;
            case "deleted":
              message = "账户不存在";
              reason = "此账号已被删除";
              break;
            default:
              message = "账户状态异常";
              reason = "请联系管理员";
          }
          return {
            success: false,
            code: 401,
            message,
            error: {
              reason
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        const updateData = {
          oauth_provider: oauthUser.provider,
          oauth_id: oauthUser.id
        };
        if (oauthUser.avatar_url && existingUser.avatar_url !== oauthUser.avatar_url) {
          updateData.avatar_url = oauthUser.avatar_url;
        }
        if (oauthUser.provider === "wechat" && oauthUser.openid) {
          updateData.wechat_openid = oauthUser.openid;
        }
        console.log("OAuth Register - Updating existing user with OAuth info");
        existingUser = await this.db.updateUser(existingUser.id, updateData);
        const token2 = await this.generateToken(existingUser);
        return {
          success: true,
          code: 200,
          message: "登录成功",
          data: {
            user: existingUser,
            token: token2
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.log("OAuth Register - Creating new user for:", oauthUser.email);
      const username = await this.generateUniqueUsername(oauthUser.name);
      console.log("OAuth Register - Generated username:", username);
      const userData = {
        username,
        email: oauthUser.email,
        password_hash: "",
        // OAuth用户不需要密码
        role,
        avatar_url: oauthUser.avatar_url,
        balance: 0,
        total_earnings: 0,
        status: "active",
        oauth_provider: oauthUser.provider,
        oauth_id: oauthUser.id
      };
      if (oauthUser.provider === "wechat" && oauthUser.openid) {
        userData.wechat_openid = oauthUser.openid;
      }
      const newUser = await this.db.createUser(userData);
      console.log("OAuth Register - User created successfully:", newUser.id);
      const token = await this.generateToken(newUser);
      return {
        success: true,
        code: 200,
        message: "注册成功",
        data: {
          user: newUser,
          token
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("OAuth register error:", error);
      return {
        success: false,
        code: 500,
        message: "OAuth注册失败",
        error: {
          reason: "服务器内部错误"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  // 生成唯一用户名
  async generateUniqueUsername(baseName) {
    let cleanName = baseName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, "").substring(0, 15);
    if (!cleanName) {
      cleanName = "user";
    }
    let username = cleanName;
    let counter = 1;
    while (await this.db.getUserByUsername(username)) {
      username = `${cleanName}${counter}`;
      counter++;
    }
    return username;
  }
}
function createSuccessResponse(data, message = "success") {
  return {
    success: true,
    code: 200,
    message,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createErrorResponse(code, message, field, reason) {
  return {
    success: false,
    code,
    message,
    error: field && reason ? { field, reason } : { reason: reason || message },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$/;
  return usernameRegex.test(username);
}
function sanitizeInput(input) {
  return input.trim().replace(/[<>"'&]/g, "");
}
const WECHAT_PAY_CONFIG = {
  appid: "wxc93ae8ea2bd556b1",
  // 微信支付官方测试appid
  mchid: "1499909852",
  // 微信支付官方测试商户号
  // 商户私钥（这是微信支付官方文档中的测试私钥，仅用于演示）
  // ⚠️ 警告：在生产环境中绝对不要将私钥放在前端代码中！
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCo0/D1xxH6cUv
bS6niUz8hi4fEicq2Bg4Y5uwaHJ5tdO2DX9jwzD659DQziFKbkR9pr6K/akyO9Tl
K7p58G9jwk9iFe36aga0XfarOqqGlrmC3MVCeHIzguvx7nR8bQPwPh1W0uTWey/G
NJ4VTk/14PlFFhs74D2gyI79frw++QRP1KKFIRMtV8b5Wt0sul8gkqp6IV7RdtNT
TJLakzIfq2mTRwGB/5zC2OAhImeWEiROlnYWkQXSQDozFhi+AOBNwHVbsEJ6elNo
YM+NZwp8c5jzTERDamPwomtS6KIE1EFkGZlCdeKqKdeWuXpbfFq1knkdZtz+ErAo
Tr/pmrdZAgMBAAECggEADcxSDUokoRx7dB9DXXEoWgaRInbA/BKRtP2qvdjJtMMl
HRTb4RCnWkIw1Xync4VZqaa2f1f4NK11LEHrWFWpL+NIiWWQl14I16SJph3klOH+
iL5p5YpwXiJ744zKCUAZNWDR56PPwTy+aEi2pEAG/yFRyooEqDv/YnSVXncrlTMm
aXwamya3d6Kv5p3sWKZBGmz8jW/Ee9RkouCwynqFKHx+Kc7364Dc91loJpxCelLY
VvnykMPAPnvxw9prTy2AC/8n9eiBIGr4f+LSmgME6ZUVJFf7+JLDtemtzdyaT7PW
1m/BtfsbfPIiZDFEQ3wERIwAgBmXcPxX+QOXB1hguQKBgQDjb6bzrHDuU41RUwsd
mE3h8LnMz9YYzyX1JHXoXjgtWooxu/K61do3J7uJnui7INQEoJ1m54N5YQAQCbgM
qrkeejkOYAFhXS90z7xNctS6kD3pU3kcr3NeWEnpBE8v+L2n0+dOnypgGWgLJKOd
XJnSafgKBjyGV7GmH8qZYjwxHwKBgQDbFShHL+U6NelXfhjsuy6RpaYCOqQ2DUmt
2CV6l/GvawDknyyCC6X6JZ5NXGc8yndkdKbfpbkwMKlk6Rv4z+bumJ1Vu6FEd1KI
eyVO0FDpSosNjF3+AEDXfkLsyaxH0qohialpgkykLJqaZVIeahinyDora6989/DM
6AfXBXkwhwKBgQDgDzr2jEelQwLRv3IP8d+oWzNwJsDRKCJI42aVSV0msS+712FF
1zBnbek/pyG4WJsHBASNQD8x8PHS2wBK2lYNRHO5SbOSa+84sP7dfec89KVJnEaQ
j/ikVW5a9TfeFrsg/4280uk4S09Iywu1F2ki9eq6VXKDFxmYg3FgsnqCGQKBgHuh
QdyCK7IgsC/+aaRVsN7iAn9phjc2Ymim++dljS53jMZ3CI/OcPhreByh02RbwOpA
Zdb5VzrZiw31+iH7eI8WMlsqCcRwLXP1QkVqiu5LcZLQrk3i6LRyfOPQntbdC8Ln
Q2HV9NgEj64nFSMyrf0ooaLVHu+/nvSSz7HIVe5LAoGBAJH3v8/0ETrpmEmfFLK5
3NIxD7zpc1+fE2ZzFSThVtByfbgYogfnPsf14jR1wEF7pUJGqu1YN4Td423IaCmX
ZbOFrUU+dZSkNxfckIH4ygNLqCtBZoCS1AWggO3UxyqaCELUkJ2ISbm7gB7AZnm/
QLFn7umoiY2T51RjO7MvCE02
-----END PRIVATE KEY-----`,
  // 证书序列号
  serialNo: "3488CA4842E03793D1D52E89256352D1C0C7E331",
  // 微信支付API密钥（从环境变量获取，如果没有则使用配置中的密钥）
  apiKey: "5X2z7A9mF0kP4Qj8L6cY3nR1tZ9B5vS2"
  // 32位APIv3密钥，需要在微信支付商户平台设置
};
const getTimestamp = () => {
  return Math.floor(Date.now() / 1e3);
};
const generateNonceStr = () => {
  return Math.random().toString(36).substr(2, 32);
};
const buildSignString = (method, url, timestamp, nonceStr, body) => {
  const signString = `${method}
${url}
${timestamp}
${nonceStr}
${body}
`;
  console.log("构造的签名串:", signString);
  return signString;
};
const generateSignature = async (signString, privateKey) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(signString);
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      data
    );
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    console.log("生成的签名:", signatureBase64);
    return signatureBase64;
  } catch (error) {
    console.error("签名生成失败:", error);
    throw new Error("签名生成失败");
  }
};
const buildAuthorizationHeader = (mchid, serialNo, nonceStr, timestamp, signature) => {
  const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
  console.log("构造的Authorization头:", authHeader);
  return authHeader;
};
const generateWechatPayHeaders = async (method, url, body) => {
  console.log("开始生成微信支付签名...");
  const timestamp = getTimestamp();
  console.log("时间戳:", timestamp);
  const nonceStr = generateNonceStr();
  console.log("随机串:", nonceStr);
  const signString = buildSignString(method, url, timestamp, nonceStr, body);
  const signature = await generateSignature(signString, WECHAT_PAY_CONFIG.privateKey);
  const authorization = buildAuthorizationHeader(
    WECHAT_PAY_CONFIG.mchid,
    WECHAT_PAY_CONFIG.serialNo,
    nonceStr,
    timestamp,
    signature
  );
  console.log("微信支付签名生成完成!");
  return {
    "Authorization": authorization,
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "WorkflowHub/1.0"
  };
};
const getUserIP = (c) => {
  const cfConnectingIp = c.req.header("CF-Connecting-IP");
  const xForwardedFor = c.req.header("X-Forwarded-For");
  const xRealIp = c.req.header("X-Real-IP");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  if (xRealIp) {
    return xRealIp;
  }
  return "127.0.0.1";
};
const isMobile = (userAgent2) => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent2);
};
const callWechatH5PayAPI = async (orderInfo, userIP, origin) => {
  const paymentData = {
    appid: WECHAT_PAY_CONFIG.appid,
    mchid: WECHAT_PAY_CONFIG.mchid,
    description: orderInfo.description || orderInfo.name,
    out_trade_no: orderInfo.id,
    // 使用传入的订单ID，确保一致性
    time_expire: new Date(Date.now() + 30 * 60 * 1e3).toISOString().replace("Z", "+08:00"),
    // 30分钟后过期
    attach: `订单ID:${orderInfo.id}`,
    notify_url: `${origin}/api/wechat/pay/notify`,
    // 支付回调地址
    goods_tag: "WXG",
    support_fapiao: false,
    amount: {
      total: Math.round(orderInfo.price * 100),
      // 转换为分
      currency: "CNY"
      // 微信支付只支持人民币
    },
    detail: {
      cost_price: Math.round(orderInfo.price * 100),
      invoice_id: `INV_${orderInfo.id.substring(0, 28)}`,
      // 确保不超过32字节
      goods_detail: [
        {
          merchant_goods_id: orderInfo.id,
          wechatpay_goods_id: "1001",
          goods_name: orderInfo.name,
          quantity: 1,
          unit_price: Math.round(orderInfo.price * 100)
        }
      ]
    },
    scene_info: {
      payer_client_ip: userIP,
      device_id: "013467007045764",
      store_info: {
        id: "0001",
        name: "WorkflowHub在线商店",
        area_code: "440305",
        address: "在线服务"
      },
      h5_info: {
        type: "Wap",
        app_name: "WorkflowHub",
        app_url: origin,
        // 使用当前网站域名
        bundle_id: "com.workflowhub.app",
        package_name: "com.workflowhub.app"
      }
    },
    settle_info: {
      profit_sharing: false
    }
  };
  const requestBody = JSON.stringify(paymentData);
  const headers = await generateWechatPayHeaders("POST", "/v3/pay/transactions/h5", requestBody);
  console.log("微信H5支付请求参数:", {
    url: "https://api.mch.weixin.qq.com/v3/pay/transactions/h5",
    method: "POST",
    headers,
    body: paymentData
  });
  const response = await fetch("https://api.mch.weixin.qq.com/v3/pay/transactions/h5", {
    method: "POST",
    headers,
    body: requestBody
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("微信H5支付API调用失败:", response.status, errorText);
    throw new Error(`微信H5支付API调用失败: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  console.log("微信H5支付API响应:", result);
  return result;
};
const callWechatNativePayAPI = async (orderInfo, userIP, origin) => {
  const paymentData = {
    appid: WECHAT_PAY_CONFIG.appid,
    mchid: WECHAT_PAY_CONFIG.mchid,
    description: orderInfo.description || orderInfo.name,
    out_trade_no: orderInfo.id,
    // 使用传入的订单ID，确保一致性
    time_expire: new Date(Date.now() + 30 * 60 * 1e3).toISOString().replace("Z", "+08:00"),
    // 30分钟后过期
    attach: `订单ID:${orderInfo.id}`,
    notify_url: `${origin}/api/wechat/pay/notify`,
    // 支付回调地址
    goods_tag: "WXG",
    support_fapiao: false,
    amount: {
      total: Math.round(orderInfo.price * 100),
      // 转换为分
      currency: "CNY"
      // 微信支付只支持人民币
    },
    detail: {
      cost_price: Math.round(orderInfo.price * 100),
      invoice_id: `INV_${orderInfo.id.substring(0, 28)}`,
      // 确保不超过32字节
      goods_detail: [
        {
          merchant_goods_id: orderInfo.id,
          wechatpay_goods_id: "1001",
          goods_name: orderInfo.name,
          quantity: 1,
          unit_price: Math.round(orderInfo.price * 100)
        }
      ]
    },
    scene_info: {
      payer_client_ip: userIP,
      device_id: "013467007045764",
      store_info: {
        id: "0001",
        name: "WorkflowHub在线商店",
        area_code: "440305",
        address: "在线服务"
      }
    },
    settle_info: {
      profit_sharing: false
    }
  };
  const requestBody = JSON.stringify(paymentData);
  const headers = await generateWechatPayHeaders("POST", "/v3/pay/transactions/native", requestBody);
  console.log("微信Native支付请求参数:", {
    url: "https://api.mch.weixin.qq.com/v3/pay/transactions/native",
    method: "POST",
    headers,
    body: paymentData
  });
  const response = await fetch("https://api.mch.weixin.qq.com/v3/pay/transactions/native", {
    method: "POST",
    headers,
    body: requestBody
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("微信Native支付API调用失败:", response.status, errorText);
    throw new Error(`微信Native支付API调用失败: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  console.log("微信Native支付API响应:", result);
  return result;
};
const queryWechatPayStatus = async (outTradeNo) => {
  const urlForSign = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${WECHAT_PAY_CONFIG.mchid}`;
  const headers = await generateWechatPayHeaders("GET", urlForSign, "");
  console.log("查询支付状态请求参数:", {
    url: `https://api.mch.weixin.qq.com${urlForSign}`,
    method: "GET",
    headers
  });
  const response = await fetch(`https://api.mch.weixin.qq.com${urlForSign}`, {
    method: "GET",
    headers
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("查询支付状态API调用失败:", response.status, errorText);
    throw new Error(`查询支付状态API调用失败: ${response.status} ${errorText}`);
  }
  const result = await response.json();
  console.log("查询支付状态API响应:", result);
  return result;
};
class WechatPayService {
  // 处理H5支付
  static async handleH5Payment(c, orderInfo) {
    try {
      const userIP = getUserIP(c);
      const origin = new URL(c.req.url).origin;
      console.log("处理H5支付:", { orderInfo, userIP, origin });
      const result = await callWechatH5PayAPI(orderInfo, userIP, origin);
      return c.json(createSuccessResponse({
        h5_url: result.h5_url,
        prepay_id: result.prepay_id,
        out_trade_no: orderInfo.id
        // 返回实际使用的订单号
      }));
    } catch (error) {
      console.error("H5支付处理失败:", error);
      return c.json(createErrorResponse(500, "微信H5支付失败", "server", error instanceof Error ? error.message : "服务器内部错误"), 500);
    }
  }
  // 处理Native支付
  static async handleNativePayment(c, orderInfo) {
    try {
      const userIP = getUserIP(c);
      const origin = new URL(c.req.url).origin;
      console.log("处理Native支付:", { orderInfo, userIP, origin });
      const result = await callWechatNativePayAPI(orderInfo, userIP, origin);
      return c.json(createSuccessResponse({
        code_url: result.code_url,
        prepay_id: result.prepay_id,
        out_trade_no: orderInfo.id
        // 返回实际使用的订单号
      }));
    } catch (error) {
      console.error("Native支付处理失败:", error);
      return c.json(createErrorResponse(500, "微信Native支付失败", "server", error instanceof Error ? error.message : "服务器内部错误"), 500);
    }
  }
  // 处理支付状态查询
  static async handlePaymentQuery(c, outTradeNo) {
    try {
      console.log("查询支付状态:", outTradeNo);
      const result = await queryWechatPayStatus(outTradeNo);
      return c.json(createSuccessResponse({
        trade_state: result.trade_state,
        trade_state_desc: result.trade_state_desc,
        out_trade_no: result.out_trade_no,
        transaction_id: result.transaction_id,
        amount: result.amount
      }));
    } catch (error) {
      console.error("查询支付状态失败:", error);
      return c.json(createErrorResponse(500, "查询支付状态失败", "server", error instanceof Error ? error.message : "服务器内部错误"), 500);
    }
  }
  // 处理支付回调
  static async handlePaymentNotify(c) {
    try {
      const body = await c.req.text();
      console.log("微信支付回调原始数据:", body);
      const callbackData = JSON.parse(body);
      console.log("微信支付回调解析数据:", callbackData);
      if (callbackData.event_type === "TRANSACTION.SUCCESS") {
        const resource = callbackData.resource;
        let decryptedData;
        try {
          decryptedData = await this.decryptWechatPayData(
            resource.ciphertext,
            resource.associated_data,
            resource.nonce
          );
          console.log("解密后的支付数据:", decryptedData);
        } catch (decryptError) {
          console.error("解密支付回调数据失败:", decryptError);
          console.log("尝试从原始回调数据获取订单信息...");
          const resourceStr = JSON.stringify(resource);
          console.log("Resource数据:", resourceStr);
          const outTradeNoMatch = resourceStr.match(/"out_trade_no"\s*:\s*"([^"]+)"/);
          const transactionIdMatch = resourceStr.match(/"transaction_id"\s*:\s*"([^"]+)"/);
          decryptedData = {
            out_trade_no: outTradeNoMatch ? outTradeNoMatch[1] : null,
            transaction_id: transactionIdMatch ? transactionIdMatch[1] : null,
            trade_state: "SUCCESS"
          };
          console.log("从原始数据提取的信息:", decryptedData);
        }
        const outTradeNo = decryptedData.out_trade_no;
        const transactionId = decryptedData.transaction_id;
        const tradeState = decryptedData.trade_state;
        console.log("支付回调信息:", { outTradeNo, transactionId, tradeState });
        if (tradeState === "SUCCESS" && outTradeNo) {
          await this.processSuccessfulPayment(c, outTradeNo, transactionId);
        } else {
          console.error("支付回调数据不完整:", { outTradeNo, transactionId, tradeState });
        }
      }
      return c.json({
        code: "SUCCESS",
        message: "成功"
      });
    } catch (error) {
      console.error("微信支付回调处理错误:", error);
      return c.json({
        code: "FAIL",
        message: "处理失败"
      });
    }
  }
  // 处理支付成功后的业务逻辑
  static async processSuccessfulPayment(c, outTradeNo, transactionId) {
    try {
      console.log("处理支付成功业务逻辑:", { outTradeNo, transactionId });
      const order = await c.env.DB.prepare(`
        SELECT * FROM orders WHERE out_trade_no = ? AND payment_status = 'pending'
      `).bind(outTradeNo).first();
      if (!order) {
        console.error("订单不存在或已处理:", outTradeNo);
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const batch = [
        // 1. 更新订单状态
        c.env.DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid', transaction_id = ?, paid_at = ?, updated_at = ?
          WHERE out_trade_no = ?
        `).bind(transactionId, now, now, outTradeNo),
        // 2. 插入交易记录到transactions表
        c.env.DB.prepare(`
          INSERT INTO transactions (
            user_id, workflow_id, type, transaction_type, amount, status, payment_method, payment_id, description, created_at
          ) VALUES (?, ?, ?, ?, ?, 'completed', 'wechat', ?, ?, ?)
        `).bind(
          order.user_id,
          order.workflow_id || null,
          order.order_type === "membership" ? "recharge" : order.order_type,
          order.order_type === "membership" ? "recharge" : order.order_type,
          order.amount,
          transactionId,
          `${order.order_title} - 微信支付`,
          now
        )
      ];
      await c.env.DB.batch(batch);
      console.log("订单和交易记录更新完成:", { outTradeNo, transactionId });
      if (order.order_type === "membership") {
        await this.updateUserMembership(c, order.user_id, order.membership_type, order.membership_period);
      }
      if (order.order_type === "recharge") {
        await this.addWhCoins(c, order.user_id, order.amount);
      }
      if (order.order_type === "workflow" && order.workflow_id) {
        await this.addUserWorkflowRelation(c, order.user_id, order.workflow_id);
      }
      console.log("支付成功处理完成:", outTradeNo);
    } catch (error) {
      console.error("处理支付成功业务逻辑失败:", error);
      throw error;
    }
  }
  // 更新用户会员状态
  static async updateUserMembership(c, userId, membershipType, membershipPeriod) {
    try {
      const now = /* @__PURE__ */ new Date();
      let endDate = new Date(now);
      if (membershipPeriod === "month") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (membershipPeriod === "year") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      const membershipTypeMapping = {
        "light": "basic",
        "light-plus": "basic",
        "light-yearly": "basic",
        "light-plus-yearly": "basic",
        "basic": "basic",
        "basic-plus": "basic",
        "basic-yearly": "basic",
        "basic-plus-yearly": "basic",
        "professional": "premium",
        "professional-yearly": "premium"
      };
      const standardMembershipType = membershipTypeMapping[membershipType] || "basic";
      let whCoinsToAdd = 0;
      if (membershipType.includes("light")) {
        whCoinsToAdd = 8e3;
      } else if (membershipType.includes("basic")) {
        whCoinsToAdd = 5e4;
      } else if (membershipType.includes("professional")) {
        whCoinsToAdd = 75e3;
      } else {
        whCoinsToAdd = 5e4;
      }
      console.log("会员类型映射:", {
        originalType: membershipType,
        standardType: standardMembershipType,
        whCoinsToAdd
      });
      await c.env.DB.prepare(`
        UPDATE users 
        SET membership_type = ?, membership_start_date = ?, membership_end_date = ?, 
            wh_coins = wh_coins + ?, updated_at = ?
        WHERE id = ?
      `).bind(
        standardMembershipType,
        now.toISOString(),
        endDate.toISOString(),
        whCoinsToAdd,
        now.toISOString(),
        userId
      ).run();
      console.log("用户会员状态更新成功:", {
        userId,
        originalMembershipType: membershipType,
        standardMembershipType,
        membershipPeriod,
        whCoinsAdded: whCoinsToAdd
      });
    } catch (error) {
      console.error("更新用户会员状态失败:", error);
      throw error;
    }
  }
  // 添加WH币
  static async addWhCoins(c, userId, amount) {
    try {
      let whCoinsToAdd = 0;
      let bonus = 0;
      if (amount === 4.99) {
        whCoinsToAdd = 500;
        bonus = 0;
      } else if (amount === 9.99) {
        whCoinsToAdd = 1e3;
        bonus = 100;
      } else if (amount === 19.99) {
        whCoinsToAdd = 2e3;
        bonus = 300;
      } else if (amount === 49.99) {
        whCoinsToAdd = 5e3;
        bonus = 1e3;
      } else {
        whCoinsToAdd = Math.floor(amount * 100);
      }
      const totalCoins = whCoinsToAdd + bonus;
      await c.env.DB.prepare(`
        UPDATE users 
        SET wh_coins = wh_coins + ?, updated_at = ?
        WHERE id = ?
      `).bind(
        totalCoins,
        (/* @__PURE__ */ new Date()).toISOString(),
        userId
      ).run();
      console.log("WH币充值成功:", { userId, amount, whCoinsAdded: whCoinsToAdd, bonus, totalCoins });
    } catch (error) {
      console.error("WH币充值失败:", error);
      throw error;
    }
  }
  // 添加用户工作流关系（购买记录）
  static async addUserWorkflowRelation(c, userId, workflowId) {
    try {
      console.log("添加用户工作流购买记录:", { userId, workflowId });
      const existingPurchase = await c.env.DB.prepare(`
        SELECT id FROM user_workflows 
        WHERE user_id = ? AND workflow_id = ? AND action = 'purchase'
      `).bind(userId, workflowId).first();
      if (existingPurchase) {
        console.log("用户已购买过此工作流:", { userId, workflowId });
        return;
      }
      await c.env.DB.prepare(`
        INSERT INTO user_workflows (user_id, workflow_id, action, created_at)
        VALUES (?, ?, 'purchase', ?)
      `).bind(userId, workflowId, (/* @__PURE__ */ new Date()).toISOString()).run();
      console.log("用户工作流购买记录添加成功:", { userId, workflowId });
    } catch (error) {
      console.error("添加用户工作流购买记录失败:", error);
      throw error;
    }
  }
  // 根据设备类型自动选择支付方式
  static async handleAutoPayment(c, orderInfo) {
    const userAgent2 = c.req.header("User-Agent") || "";
    const mobile = isMobile(userAgent2);
    console.log("自动选择支付方式:", { mobile, userAgent: userAgent2 });
    if (mobile) {
      return this.handleH5Payment(c, orderInfo);
    } else {
      return this.handleNativePayment(c, orderInfo);
    }
  }
  // 解密微信支付回调数据
  static async decryptWechatPayData(ciphertext, associatedData, nonce) {
    try {
      const apiKey = WECHAT_PAY_CONFIG.apiKey;
      console.log("开始解密微信支付数据:", {
        ciphertextLength: ciphertext.length,
        associatedData,
        nonceLength: nonce.length,
        apiKeyLength: apiKey.length
      });
      if (apiKey.length !== 32) {
        throw new Error(`API密钥长度错误，期望32字节，实际${apiKey.length}字节`);
      }
      const keyBuffer = new TextEncoder().encode(apiKey);
      let ciphertextBuffer, nonceBuffer;
      try {
        ciphertextBuffer = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
        const nonceStr = nonce;
        const nonceBytes = new TextEncoder().encode(nonceStr);
        nonceBuffer = new Uint8Array(12);
        const copyLength = Math.min(nonceBytes.length, 12);
        nonceBuffer.set(nonceBytes.slice(0, copyLength));
      } catch (decodeError) {
        throw new Error(`Base64解码失败: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
      }
      const associatedDataBuffer = new TextEncoder().encode(associatedData);
      console.log("解密参数详情:", {
        keyBufferLength: keyBuffer.length,
        ciphertextBufferLength: ciphertextBuffer.length,
        nonceBufferLength: nonceBuffer.length,
        associatedDataBufferLength: associatedDataBuffer.length,
        ciphertextHex: Array.from(ciphertextBuffer.slice(0, 32)).map((b) => b.toString(16).padStart(2, "0")).join(""),
        nonceHex: Array.from(nonceBuffer).map((b) => b.toString(16).padStart(2, "0")).join("")
      });
      if (nonceBuffer.length !== 12) {
        throw new Error(`Nonce长度错误: ${nonceBuffer.length}字节，期望12字节`);
      }
      if (ciphertextBuffer.length <= 16) {
        throw new Error(`密文长度不足: ${ciphertextBuffer.length}字节，至少需要17字节`);
      }
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: nonceBuffer,
          // 12字节的nonce作为初始化向量
          additionalData: associatedDataBuffer,
          // 附加认证数据
          tagLength: 128
          // 认证标签长度128位（16字节）
        },
        cryptoKey,
        ciphertextBuffer
        // 包含认证标签的完整密文
      );
      const decryptedText = new TextDecoder("utf-8").decode(decryptedBuffer);
      console.log("解密成功!");
      console.log("解密后数据长度:", decryptedText.length);
      console.log("解密后数据预览:", decryptedText.substring(0, 200));
      const result = JSON.parse(decryptedText);
      console.log("JSON解析成功，包含字段:", Object.keys(result));
      return result;
    } catch (error) {
      console.error("解密微信支付数据失败:", error);
      console.error("错误详情:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : void 0
      });
      if (error instanceof Error && error.name === "OperationError") {
        console.error("这通常是由以下原因造成的:");
        console.error("1. API密钥不正确");
        console.error("2. 密文、nonce或associated_data被篡改");
        console.error("3. 加密算法参数不匹配");
        console.error("当前使用的API密钥:", WECHAT_PAY_CONFIG.apiKey);
      }
      throw error;
    }
  }
  // 微信商家转账到零钱（新版API v3）
  static async transferToWallet(c, withdrawalId, amount, userId, description = "创作者提现") {
    try {
      console.log("开始微信商家转账:", { withdrawalId, amount, userId, description });
      const user = await c.env.DB.prepare(`
        SELECT wechat_openid FROM users WHERE id = ?
      `).bind(userId).first();
      if (!user || !user.wechat_openid) {
        throw new Error("用户未绑定微信账号");
      }
      const userOpenid = user.wechat_openid;
      console.log("获取到用户openid:", userOpenid);
      const transferData = {
        appid: WECHAT_PAY_CONFIG.appid,
        out_batch_no: withdrawalId,
        // 商户批次单号
        batch_name: description,
        batch_remark: description,
        total_amount: Math.round(amount * 100),
        // 转换为分
        total_num: 1,
        transfer_detail_list: [
          {
            out_detail_no: `${withdrawalId}001`,
            // 商户明细单号（只能包含数字和字母）
            transfer_amount: Math.round(amount * 100),
            // 转换为分
            transfer_remark: description,
            openid: userOpenid
            // 使用用户绑定的微信openid
            // user_name 字段是可选的，如果不提供则微信会使用默认值
          }
        ],
        transfer_scene_id: "1005"
        // 转账场景ID：1005-佣金报酬
      };
      const requestBody = JSON.stringify(transferData);
      const url = "/v3/transfer/batches";
      const method = "POST";
      const headers = await generateWechatPayHeaders(method, url, requestBody);
      const response = await fetch(`https://api.mch.weixin.qq.com${url}`, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: requestBody
      });
      const responseText = await response.text();
      console.log("微信商家转账响应:", { status: response.status, body: responseText });
      if (!response.ok) {
        throw new Error(`微信商家转账请求失败: ${response.status} ${responseText}`);
      }
      const result = JSON.parse(responseText);
      return {
        success: true,
        data: {
          batch_id: result.batch_id,
          out_batch_no: result.out_batch_no,
          batch_status: result.batch_status,
          create_time: result.create_time
        }
      };
    } catch (error) {
      console.error("微信商家转账失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        code: "TRANSFER_FAILED"
      };
    }
  }
  // 查询商家转账状态
  static async queryTransferStatus(outBatchNo) {
    try {
      const url = `/v3/transfer/batches/out-batch-no/${outBatchNo}`;
      const method = "GET";
      const headers = await generateWechatPayHeaders(method, url, "");
      const response = await fetch(`https://api.mch.weixin.qq.com${url}`, {
        method,
        headers
      });
      const responseText = await response.text();
      console.log("查询商家转账状态响应:", { status: response.status, body: responseText });
      if (!response.ok) {
        throw new Error(`查询商家转账状态失败: ${response.status} ${responseText}`);
      }
      const result = JSON.parse(responseText);
      return {
        success: true,
        data: {
          batch_id: result.batch_id,
          out_batch_no: result.out_batch_no,
          batch_status: result.batch_status,
          batch_type: result.batch_type,
          total_amount: result.total_amount,
          total_num: result.total_num,
          success_amount: result.success_amount,
          success_num: result.success_num,
          fail_amount: result.fail_amount,
          fail_num: result.fail_num,
          create_time: result.create_time,
          update_time: result.update_time
        }
      };
    } catch (error) {
      console.error("查询商家转账状态失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        code: "QUERY_FAILED"
      };
    }
  }
}
class VideoTaskMonitor {
  env;
  isRunning = false;
  intervalId = null;
  authService;
  constructor(env2) {
    this.env = env2;
    const db = new D1Database(env2);
    this.authService = new AuthService(env2, db);
  }
  // 启动监控服务
  start() {
    if (this.isRunning) {
      console.log("视频任务监控服务已在运行中");
      return;
    }
    this.isRunning = true;
    console.log("启动视频任务监控服务");
    this.checkPendingTasks();
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        console.log("定时器触发：开始检查视频任务");
        this.checkPendingTasks().catch((error) => {
          console.error("定时检查视频任务时发生错误:", error);
        });
      }
    }, 1e4);
    console.log("视频任务监控定时器已启动，间隔：10秒");
  }
  // 停止监控服务
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("停止视频任务监控服务");
  }
  // 检查待处理的任务
  async checkPendingTasks() {
    console.log("=== 开始检查待处理的视频任务 ===");
    try {
      console.log("开始检查待处理的视频生成任务...");
      const { results: tasks } = await this.env.DB.prepare(`
        SELECT id, execute_id, workflow_id, token, notification_email, created_at
        FROM video_generation_tasks 
        WHERE status = 'running'
        ORDER BY created_at ASC
        LIMIT 50
      `).all();
      console.log(`数据库查询结果: 找到 ${tasks ? tasks.length : 0} 个状态为 'running' 的任务`);
      if (!tasks || tasks.length === 0) {
        console.log("没有找到运行中的任务，跳过本次检查");
        return;
      }
      console.log(`检查到 ${tasks.length} 个运行中的视频生成任务`);
      const checkPromises = tasks.map((task) => this.checkSingleTask(task));
      await Promise.allSettled(checkPromises);
    } catch (error) {
      console.error("检查视频任务时发生错误:", error);
    }
    console.log("=== 视频任务检查完成 ===");
  }
  // 检查单个任务状态
  async checkSingleTask(task) {
    try {
      const { id, execute_id, workflow_id, token } = task;
      console.log(`开始检查任务 ${id} (execute_id: ${execute_id}, workflow_id: ${workflow_id})`);
      const apiUrl = `https://api.coze.cn/v1/coze-workflows/${workflow_id}/run_histories/${execute_id}`;
      console.log(`正在调用 Coze API: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Coze API 响应状态: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        console.error(`查询任务 ${id} 状态失败:`, response.status, response.statusText);
        return;
      }
      const result = await response.json();
      console.log(`任务 ${id} API 返回结果:`, JSON.stringify(result, null, 2));
      if (result.code === 0 && result.data && result.data.length > 0) {
        const taskData = result.data[0];
        const executeStatus = taskData.execute_status;
        if (executeStatus === "Success") {
          let outputUrl = null;
          try {
            if (taskData.output) {
              const outputData = JSON.parse(taskData.output);
              if (outputData.Output) {
                const outputContent = JSON.parse(outputData.Output);
                if (outputContent.output) {
                  outputUrl = outputContent.output.replace(/`/g, "").trim();
                }
              }
            }
          } catch (parseError) {
            console.error(`解析任务 ${id} 输出时发生错误:`, parseError);
          }
          await this.updateTaskStatus(id, "completed", taskData, null, outputUrl);
          console.log(`任务 ${id} 执行成功，输出URL: ${outputUrl}`);
        } else if (executeStatus === "Failed") {
          await this.updateTaskStatus(id, "failed", taskData, taskData.error_message || "任务执行失败", null);
          console.log(`任务 ${id} 执行失败:`, taskData.error_message);
        } else if (executeStatus === "Running") {
          console.log(`任务 ${id} 当前状态: ${executeStatus}，继续等待...`);
        } else {
          console.log(`任务 ${id} 当前状态: ${executeStatus}，继续等待...`);
        }
      } else {
        console.error(`任务 ${id} API 返回格式异常:`, result);
      }
    } catch (error) {
      console.error(`检查任务 ${task.id} 时发生错误:`, error);
    }
  }
  // 更新任务状态
  async updateTaskStatus(taskId, status, resultData, errorMessage, outputUrl = null) {
    try {
      const task = await this.env.DB.prepare(`
        SELECT notification_email, title FROM video_generation_tasks WHERE id = ?
      `).bind(taskId).first();
      await this.env.DB.prepare(`
        UPDATE video_generation_tasks 
        SET status = ?, result_data = ?, error_message = ?, output = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(status, resultData ? JSON.stringify(resultData) : null, errorMessage, outputUrl, taskId).run();
      console.log(`任务 ${taskId} 状态已更新: status=${status}, output=${outputUrl}`);
      if (task && task.notification_email) {
        await this.sendNotificationEmail(task.notification_email, task.title, status, errorMessage, outputUrl);
      }
    } catch (error) {
      console.error(`更新任务 ${taskId} 状态失败:`, error);
    }
  }
  // 发送邮件通知
  async sendNotificationEmail(email, taskTitle, status, errorMessage, outputUrl) {
    try {
      let subject = "";
      let statusText = "";
      let statusColor = "";
      let content = "";
      switch (status) {
        case "completed":
          subject = "视频生成任务完成通知";
          statusText = "已完成";
          statusColor = "#10B981";
          content = outputUrl ? `您的视频生成任务已成功完成！<br><br><strong>生成结果：</strong><br><a href="${outputUrl}" target="_blank" style="color: #667eea; text-decoration: none;">点击查看生成的视频</a>` : "您的视频生成任务已成功完成！";
          break;
        case "failed":
          subject = "视频生成任务失败通知";
          statusText = "失败";
          statusColor = "#EF4444";
          content = `很抱歉，您的视频生成任务执行失败。${errorMessage ? `错误信息：${errorMessage}` : ""}`;
          break;
        case "timeout":
          subject = "视频生成任务超时通知";
          statusText = "超时";
          statusColor = "#F59E0B";
          content = "您的视频生成任务执行超时，请重新提交任务。";
          break;
        default:
          return;
      }
      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; line-height: 60px; color: white; font-size: 24px; font-weight: bold;">WF</div>
            <h1 style="color: #333; margin: 20px 0 10px 0;">工作流分享平台</h1>
            <p style="color: #666; margin: 0;">${subject}</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #333; margin: 0 0 15px 0;">任务状态更新</h2>
            <div style="margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>任务标题：</strong>${taskTitle}</p>
              <p style="margin: 10px 0;"><strong>当前状态：</strong><span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
              <p style="margin: 10px 0; color: #666;">${content}</p>
            </div>
          </div>
          
          <div style="color: #666; font-size: 14px; line-height: 1.6;">
            <p>您可以登录平台查看详细的任务执行结果。</p>
            <p>如有任何问题，请联系客服支持。</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© 2024 工作流分享平台. All rights reserved.</p>
          </div>
        </div>
      `;
      const emailSent = await this.authService.sendNotificationEmail(email, subject, emailHtml);
      if (emailSent) {
        console.log(`视频任务状态通知邮件已发送至: ${email}, 状态: ${status}`);
      } else {
        console.error(`视频任务状态通知邮件发送失败: ${email}, 状态: ${status}`);
      }
    } catch (error) {
      console.error(`发送邮件通知失败:`, error);
    }
  }
  // 获取监控状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}
let globalMonitor = null;
function getVideoTaskMonitor(env2) {
  if (!globalMonitor) {
    globalMonitor = new VideoTaskMonitor(env2);
  }
  return globalMonitor;
}
function startVideoTaskMonitor(env2) {
  const monitor = getVideoTaskMonitor(env2);
  monitor.start();
  return monitor;
}
function stopVideoTaskMonitor() {
  if (globalMonitor) {
    globalMonitor.stop();
  }
}
const videoTaskMonitor = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VideoTaskMonitor,
  getVideoTaskMonitor,
  startVideoTaskMonitor,
  stopVideoTaskMonitor
}, Symbol.toStringTag, { value: "Module" }));
class CommissionPayoutMonitor {
  env;
  intervalId = null;
  isRunning = false;
  constructor(env2) {
    this.env = env2;
  }
  // 启动监控服务
  start() {
    if (this.isRunning) {
      console.log("佣金发放监控服务已在运行中");
      return;
    }
    this.isRunning = true;
    console.log("启动佣金发放监控服务");
    this.checkPendingPayouts();
    console.log("佣金发放监控服务已启动，将通过Cron触发器定期检查待发放记录");
  }
  // 停止监控服务
  stop() {
    this.isRunning = false;
    console.log("停止佣金发放监控服务");
  }
  // 检查待发放的佣金记录
  async checkPendingPayouts() {
    console.log("=== 开始检查待发放的佣金记录 ===");
    try {
      const now = /* @__PURE__ */ new Date();
      const currentDate = now.toISOString().split("T")[0];
      console.log(`当前日期: ${currentDate}`);
      const { results: payouts } = await this.env.DB.prepare(`
        SELECT 
          p.id,
          p.user_id,
          p.config_id,
          p.plan_id,
          p.amount,
          p.payout_type,
          p.scheduled_date,
          p.retry_count,
          u.username,
          u.email
        FROM initial_commission_payouts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'pending' 
          AND p.scheduled_date <= ?
          AND p.retry_count < 3
        ORDER BY p.scheduled_date ASC, p.created_at ASC
        LIMIT 50
      `).bind(currentDate).all();
      console.log(`数据库查询结果: 找到 ${payouts ? payouts.length : 0} 个待发放的佣金记录`);
      if (!payouts || payouts.length === 0) {
        console.log("没有找到待发放的佣金记录，跳过本次检查");
        return;
      }
      console.log(`检查到 ${payouts.length} 个待发放的佣金记录`);
      const processPromises = payouts.map((payout) => this.processSinglePayout(payout));
      const results = await Promise.allSettled(processPromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      console.log(`佣金发放处理完成: 成功 ${successful} 个, 失败 ${failed} 个`);
    } catch (error) {
      console.error("检查佣金发放记录时发生错误:", error);
    }
    console.log("=== 佣金发放检查完成 ===");
  }
  // 处理单个佣金发放记录
  async processSinglePayout(payout) {
    const payoutId = payout.id;
    const userId = payout.user_id;
    const amount = payout.amount;
    console.log(`开始处理佣金发放: ID=${payoutId}, 用户=${payout.username}, 金额=${amount}`);
    try {
      await this.env.DB.prepare(`
        UPDATE initial_commission_payouts 
        SET status = 'processing', updated_at = ?
        WHERE id = ?
      `).bind((/* @__PURE__ */ new Date()).toISOString(), payoutId).run();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const batch = [
        // 1. 创建交易记录
        this.env.DB.prepare(`
          INSERT INTO transactions (
            user_id, type, transaction_type, amount, status, payment_method, 
            description, created_at
          ) VALUES (?, 'commission', 'commission_payout', ?, 'completed', 'system', ?, ?)
        `).bind(
          userId,
          amount,
          `初始佣金发放 - ${payout.payout_type}`,
          now
        ),
        // 2. 更新用户余额
        this.env.DB.prepare(`
          UPDATE users 
          SET balance = balance + ?, updated_at = ?
          WHERE id = ?
        `).bind(amount, now, userId),
        // 3. 更新发放记录状态为completed
        this.env.DB.prepare(`
          UPDATE initial_commission_payouts 
          SET status = 'completed', 
              actual_payout_date = ?, 
              updated_at = ?,
              processed_by = 1
          WHERE id = ?
        `).bind(now.split("T")[0], now, payoutId)
      ];
      await this.env.DB.batch(batch);
      await this.env.DB.prepare(`
        INSERT INTO initial_commission_operation_logs (
          operation_type, target_type, target_id, user_id, operator_id, 
          operation_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        "payout_processed",
        "payout",
        payoutId,
        userId,
        1,
        // 系统操作
        JSON.stringify({
          amount,
          payout_type: payout.payout_type,
          scheduled_date: payout.scheduled_date
        }),
        now
      ).run();
      console.log(`✅ 佣金发放成功: ID=${payoutId}, 用户=${payout.username}, 金额=${amount}`);
    } catch (error) {
      console.error(`❌ 佣金发放失败: ID=${payoutId}, 错误:`, error);
      try {
        const newRetryCount = (payout.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? "failed" : "pending";
        await this.env.DB.prepare(`
          UPDATE initial_commission_payouts 
          SET status = ?, 
              retry_count = ?, 
              failure_reason = ?, 
              updated_at = ?
          WHERE id = ?
        `).bind(
          newStatus,
          newRetryCount,
          error instanceof Error ? error.message : String(error),
          (/* @__PURE__ */ new Date()).toISOString(),
          payoutId
        ).run();
        console.log(`更新失败记录: ID=${payoutId}, 重试次数=${newRetryCount}, 状态=${newStatus}`);
      } catch (updateError) {
        console.error(`更新失败记录时出错: ID=${payoutId}`, updateError);
      }
      throw error;
    }
  }
  // 获取监控状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}
let commissionPayoutMonitorInstance = null;
function getCommissionPayoutMonitor(env2) {
  if (!commissionPayoutMonitorInstance) {
    commissionPayoutMonitorInstance = new CommissionPayoutMonitor(env2);
  }
  return commissionPayoutMonitorInstance;
}
const commissionPayoutMonitor = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CommissionPayoutMonitor,
  getCommissionPayoutMonitor
}, Symbol.toStringTag, { value: "Module" }));
const app = new Hono2();
let monitorServicesStarted = false;
app.use("*", async (c, next) => {
  if (!monitorServicesStarted) {
    console.log("首次请求，启动视频任务监控服务...");
    startVideoTaskMonitor(c.env);
    console.log("启动佣金发放监控服务...");
    const commissionMonitor = getCommissionPayoutMonitor(c.env);
    commissionMonitor.start();
    monitorServicesStarted = true;
    console.log("所有监控服务已启动");
  }
  await next();
});
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use("*", logger());
app.use("/api/*", prettyJSON());
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json(createErrorResponse(401, "未提供认证信息"), 401);
  }
  const db = new D1Database(c.env);
  const authService = new AuthService(c.env, db);
  const token = authService.extractTokenFromHeader(authHeader);
  if (!token) {
    return c.json(createErrorResponse(401, "无效的认证格式"), 401);
  }
  const authResult = await authService.verifyPermission(token);
  if (!authResult) {
    return c.json(createErrorResponse(401, "认证失败或已过期"), 401);
  }
  c.set("user", authResult.user);
  c.set("payload", authResult.payload);
  await next();
};
const adminMiddleware = async (c, next) => {
  const user = c.get("user");
  if (!user || user.role !== "admin" && user.role !== "super_admin") {
    return c.json(createErrorResponse(403, "需要管理员权限"), 403);
  }
  await next();
};
const creatorMiddleware = async (c, next) => {
  const user = c.get("user");
  if (!user || !["creator", "admin", "super_admin"].includes(user.role)) {
    return c.json(createErrorResponse(403, "需要创作者权限"), 403);
  }
  await next();
};
app.get("/api/", (c) => {
  return c.json(createSuccessResponse({
    name: "工作流分享平台",
    version: "1.0.0",
    description: "基于React + Hono + Cloudflare Workers的工作流分享平台"
  }));
});
app.get("/api/home/stats", async (c) => {
  try {
    const [workflowStats, userStats, usageStats] = await Promise.all([
      // 获取工作流统计（使用coze_workflows表替代workflows表）
      c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM coze_workflows 
        WHERE status = 'online'
      `).first(),
      // 获取用户统计（所有用户记录数）
      c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM users
      `).first(),
      // 获取使用量统计（工作流download_count总和）
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(download_count), 0) as downloads
        FROM coze_workflows
      `).first()
    ]);
    const totalWorks = workflowStats?.count || 0;
    const totalUsers = userStats?.count || 0;
    const totalDownloads = usageStats?.downloads || 0;
    const totalUsage = totalDownloads;
    const stats = {
      totalWorks,
      totalUsers,
      totalUsage
    };
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    console.error("Get home stats error:", error);
    return c.json(createErrorResponse(500, "获取首页统计数据失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/auth/send-verification-code", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;
    if (!email) {
      return c.json(createErrorResponse(400, "缺少邮箱参数", "email", "请提供邮箱地址"), 400);
    }
    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, "邮箱格式错误", "email", "请输入有效的邮箱地址"), 400);
    }
    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);
    const result = await authService.sendEmailVerificationCode(sanitizeInput(email));
    return c.json(result, result.code);
  } catch (error) {
    return c.json(createErrorResponse(500, "发送验证码失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/auth/verify-email-code", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;
    if (!email || !code) {
      return c.json(createErrorResponse(400, "缺少必要参数", "form", "邮箱和验证码不能为空"), 400);
    }
    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, "邮箱格式错误", "email", "请输入有效的邮箱地址"), 400);
    }
    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);
    const result = await authService.verifyEmailCode(sanitizeInput(email), sanitizeInput(code));
    return c.json(result, result.code);
  } catch (error) {
    return c.json(createErrorResponse(500, "验证失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password, verificationCode, role = "user" } = body;
    if (!username || !email || !password || !verificationCode) {
      return c.json(createErrorResponse(400, "缺少必要参数", "form", "用户名、邮箱、密码和验证码不能为空"), 400);
    }
    if (!validateUsername(username)) {
      return c.json(createErrorResponse(400, "用户名格式错误", "username", "用户名只能包含字母、数字、下划线和中文，长度3-20位"), 400);
    }
    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, "邮箱格式错误", "email", "请输入有效的邮箱地址"), 400);
    }
    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);
    const result = await authService.register(
      sanitizeInput(username),
      sanitizeInput(email),
      password,
      sanitizeInput(verificationCode),
      role
    );
    if (result.code === 200) {
      try {
        const db2 = new D1Database(c.env);
        await db2.createNotification({
          recipient_id: result.data.user.id,
          sender_id: null,
          // 系统消息
          type: "welcome",
          title: "🎉 欢迎加入工作流分享平台！",
          content: "欢迎您加入我们的平台！在这里您可以发现和分享各种实用的工作流，提高工作效率。如果您想成为创作者，可以在个人中心申请创作者权限。"
        });
        const processCommissionPayouts = async (env2) => {
          try {
            const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
            const pendingPayouts = await env2.DB.prepare(`
      SELECT 
        cdr.id,
        cdr.commission_record_id,
        cdr.wh_coins_amount,
        cr.user_id
      FROM commission_daily_records cdr
      JOIN commission_records cr ON cdr.commission_record_id = cr.id
      WHERE cdr.scheduled_date = ? AND cdr.status = 'pending'
    `).bind(today).all();
            if (!pendingPayouts.results || pendingPayouts.results.length === 0) {
              console.log("No commission payouts to process today");
              return;
            }
            for (const payout of pendingPayouts.results) {
              try {
                await env2.DB.batch([
                  // 更新佣金记录状态
                  env2.DB.prepare(`
            UPDATE commission_daily_records 
            SET status = 'completed', actual_date = ?, completed_at = ?
            WHERE id = ?
          `).bind(today, (/* @__PURE__ */ new Date()).toISOString(), payout.id),
                  // 更新用户余额
                  env2.DB.prepare(`
            UPDATE users 
            SET balance = balance + ?, total_earnings = total_earnings + ?
            WHERE id = ?
          `).bind(payout.wh_coins_amount, payout.wh_coins_amount, payout.user_id)
                ]);
                console.log(`Commission payout processed: ${payout.wh_coins_amount} for user ${payout.user_id}`);
              } catch (error) {
                console.error(`Failed to process commission payout for record ${payout.id}:`, error);
              }
            }
            console.log(`Processed ${pendingPayouts.results.length} commission payouts`);
          } catch (error) {
            console.error("Error processing commission payouts:", error);
          }
        };
        app.post("/api/admin/process-commission-payouts", authMiddleware, adminMiddleware, async (c2) => {
          try {
            await processCommissionPayouts(c2.env);
            return c2.json(createSuccessResponse({ message: "佣金发放处理完成" }));
          } catch (error) {
            console.error("Process commission payouts error:", error);
            return c2.json(createErrorResponse(500, "处理佣金发放失败"), 500);
          }
        });
        let commissionPayoutInterval = null;
        const startCommissionPayoutScheduler = (env2) => {
          if (commissionPayoutInterval) {
            clearInterval(commissionPayoutInterval);
          }
          commissionPayoutInterval = setInterval(async () => {
            try {
              await processCommissionPayouts(env2);
            } catch (error) {
              console.error("Scheduled commission payout error:", error);
            }
          }, 1e4);
          console.log("Commission payout scheduler started (every 10 seconds)");
        };
        const stopCommissionPayoutScheduler = () => {
          if (commissionPayoutInterval) {
            clearInterval(commissionPayoutInterval);
            commissionPayoutInterval = null;
            console.log("Commission payout scheduler stopped");
          }
        };
        app.post("/api/admin/start-commission-scheduler", authMiddleware, adminMiddleware, async (c2) => {
          try {
            startCommissionPayoutScheduler(c2.env);
            return c2.json(createSuccessResponse({ message: "佣金发放定时任务已启动" }));
          } catch (error) {
            console.error("Start commission scheduler error:", error);
            return c2.json(createErrorResponse(500, "启动定时任务失败"), 500);
          }
        });
        app.post("/api/admin/stop-commission-scheduler", authMiddleware, adminMiddleware, async (c2) => {
          try {
            stopCommissionPayoutScheduler();
            return c2.json(createSuccessResponse({ message: "佣金发放定时任务已停止" }));
          } catch (error) {
            console.error("Stop commission scheduler error:", error);
            return c2.json(createErrorResponse(500, "停止定时任务失败"), 500);
          }
        });
      } catch (notificationError) {
        console.error("Failed to send welcome notification:", notificationError);
      }
      return c.json(createSuccessResponse(result.data, result.message));
    } else {
      return c.json(result, result.code);
    }
  } catch (error) {
    return c.json(createErrorResponse(500, "注册失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    if (!email || !password) {
      return c.json(createErrorResponse(400, "缺少必要参数", "form", "邮箱和密码不能为空"), 400);
    }
    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, "邮箱格式错误", "email", "请输入有效的邮箱地址"), 400);
    }
    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);
    const result = await authService.login(sanitizeInput(email), password);
    return c.json(result, result.code);
  } catch (error) {
    return c.json(createErrorResponse(500, "登录失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/auth/oauth/:provider", async (c) => {
  try {
    const provider = c.req.param("provider");
    const body = await c.req.json();
    const { code, role = "user", redirectUri } = body;
    if (!["github", "google", "wechat"].includes(provider)) {
      return c.json(createErrorResponse(400, "不支持的OAuth提供商"), 400);
    }
    if (!code) {
      return c.json(createErrorResponse(400, "缺少授权码", "code", "请提供OAuth授权码"), 400);
    }
    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);
    const result = await authService.oauthRegister(provider, code, role, redirectUri);
    return c.json(result, result.code);
  } catch (error) {
    console.error("OAuth route error:", error);
    return c.json(createErrorResponse(500, "OAuth认证失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/auth/oauth/:provider/url", async (c) => {
  try {
    const provider = c.req.param("provider");
    const redirectUri = c.req.query("redirect_uri") || `https://www.chaofengq.com/auth/${provider}/callback`;
    let authUrl = "";
    if (provider === "github") {
      const params = new URLSearchParams({
        client_id: c.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: "user:email",
        state: Math.random().toString(36).substring(7)
        // 简单的state参数
      });
      authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    } else if (provider === "google") {
      const params = new URLSearchParams({
        client_id: c.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: Math.random().toString(36).substring(7)
      });
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } else if (provider === "wechat") {
      const appid = c.env.WECHAT_APP_ID || "wx44142d3284d7a350";
      const state = Math.random().toString(36).substring(7);
      const params = new URLSearchParams({
        appid,
        redirect_uri: encodeURIComponent(redirectUri),
        response_type: "code",
        scope: "snsapi_login",
        state
      });
      authUrl = `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
    } else {
      return c.json(createErrorResponse(400, "不支持的OAuth提供商"), 400);
    }
    return c.json(createSuccessResponse({ authUrl }));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取授权URL失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/user/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json(createSuccessResponse(user));
});
app.get("/api/user/membership", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json(createErrorResponse(401, "用户未认证"), 401);
    }
    const userInfo = await c.env.DB.prepare(`
      SELECT membership_type, membership_start_date, membership_end_date, membership_auto_renew, wh_coins
      FROM users WHERE id = ?
    `).bind(user.id).first();
    if (!userInfo) {
      return c.json(createErrorResponse(404, "用户不存在"), 404);
    }
    const membershipInfo = {
      membership_type: userInfo.membership_type || "free",
      membership_start_date: userInfo.membership_start_date,
      membership_end_date: userInfo.membership_end_date,
      membership_auto_renew: Boolean(userInfo.membership_auto_renew),
      wh_coins: parseInt(userInfo.wh_coins || "0"),
      is_active: false
    };
    if (membershipInfo.membership_end_date) {
      const endDate = new Date(membershipInfo.membership_end_date);
      const now = /* @__PURE__ */ new Date();
      membershipInfo.is_active = endDate > now;
    }
    return c.json(createSuccessResponse(membershipInfo));
  } catch (error) {
    console.error("获取用户会员信息失败:", error);
    return c.json(createErrorResponse(500, "获取会员信息失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/user/profile", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { username, avatar_url, avatar_filename } = body;
    const db = new D1Database(c.env);
    const updates = {};
    if (username && username !== user.username) {
      if (!validateUsername(username)) {
        return c.json(createErrorResponse(400, "用户名格式错误", "username", "用户名只能包含字母、数字、下划线和中文，长度3-20位"), 400);
      }
      const existingUser = await db.getUserByUsername(username);
      if (existingUser && existingUser.id !== user.id) {
        return c.json(createErrorResponse(400, "用户名已存在", "username", "该用户名已被使用"), 400);
      }
      updates.username = sanitizeInput(username);
    }
    if (avatar_url) {
      updates.avatar_url = sanitizeInput(avatar_url);
      if (avatar_filename) {
        await c.env.DB.prepare(`
          UPDATE files 
          SET status = 'active', upload_type = 'avatar'
          WHERE user_id = ? AND filename = ? AND status = 'preview'
        `).bind(user.id, avatar_filename).run();
        await c.env.DB.prepare(`
          UPDATE files 
          SET status = 'deleted'
          WHERE user_id = ? AND upload_type = 'avatar' AND status = 'active' AND filename != ?
        `).bind(user.id, avatar_filename).run();
      }
    }
    const updatedUser = await db.updateUser(user.id, updates);
    return c.json(createSuccessResponse(updatedUser, "个人信息更新成功"));
  } catch (error) {
    return c.json(createErrorResponse(500, "更新失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/categories", async (c) => {
  try {
    const db = new D1Database(c.env);
    const categories = await db.getCategories();
    return c.json(createSuccessResponse(categories));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取分类失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/categories/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的分类ID"), 400);
    }
    const db = new D1Database(c.env);
    const category = await db.getCategoryById(id);
    if (!category) {
      return c.json(createErrorResponse(404, "分类不存在"), 404);
    }
    return c.json(createSuccessResponse(category));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取分类失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/tags", async (c) => {
  try {
    const query = c.req.query();
    const categoryId = query.category_id ? parseInt(query.category_id) : void 0;
    const region = query.region || "global";
    const db = new D1Database(c.env);
    const tags = await db.getTagsByRegion(region, categoryId);
    return c.json(createSuccessResponse(tags));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取标签失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/creator/coze-workflows/task-submission", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { taskId, title: title2, description, category, tags = [], price = 0, download_price = 0, type, isMemberFree = false, isDownloadMemberFree = false, fileUrl, fileName, fileSize, coverImageUrl, previewImages = [], previewVideoUrl, quickCommands = [], cozeApi } = body;
    if (!taskId || !title2 || !category || !fileUrl) {
      return c.json(createErrorResponse(400, "缺少必要参数", "form", "任务ID、标题、分类和文件URL不能为空"), 400);
    }
    if (price < 0) {
      return c.json(createErrorResponse(400, "价格不能为负数", "price", "请输入有效的价格"), 400);
    }
    const task = await c.env.DB.prepare(`
      SELECT id, title, status FROM tasks WHERE id = ?
    `).bind(taskId).first();
    if (!task) {
      return c.json(createErrorResponse(404, "任务不存在"), 404);
    }
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows WHERE task_id = ? AND creator_id = ?
    `).bind(taskId, user.id).first();
    const category_id = parseInt(category) || 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let result;
    if (existingSubmission) {
      result = await c.env.DB.prepare(`
        UPDATE coze_workflows SET
          title = ?, description = ?, category_id = ?, price = ?, download_price = ?,
          type = ?, is_member_free = ?, is_download_member_free = ?, tags = ?, workflow_file_url = ?, 
          workflow_file_name = ?, workflow_file_size = ?, cover_image_url = ?,
          preview_video_url = ?, preview_images = ?, quick_commands = ?, 
          coze_api = ?, status = 'pending', updated_at = ?
        WHERE task_id = ? AND creator_id = ?
      `).bind(
        sanitizeInput(title2),
        description ? sanitizeInput(description) : "",
        category_id,
        parseFloat(price.toString()),
        parseFloat(download_price.toString()),
        type ? sanitizeInput(type) : "coze",
        Boolean(isMemberFree),
        Boolean(isDownloadMemberFree),
        JSON.stringify(tags.map((tag) => sanitizeInput(tag))),
        sanitizeInput(fileUrl),
        fileName ? sanitizeInput(fileName) : null,
        fileSize ? parseInt(fileSize.toString()) : null,
        coverImageUrl ? sanitizeInput(coverImageUrl) : null,
        previewVideoUrl ? sanitizeInput(previewVideoUrl) : null,
        previewImages && previewImages.length > 0 ? JSON.stringify(previewImages.map((img) => sanitizeInput(img))) : JSON.stringify([]),
        JSON.stringify(quickCommands.map((cmd) => sanitizeInput(cmd))),
        cozeApi ? sanitizeInput(cozeApi) : null,
        now,
        taskId,
        user.id
      ).run();
    } else {
      result = await c.env.DB.prepare(`
        INSERT INTO coze_workflows (
          creator_id, task_id, title, description, category_id, price, download_price,
          type, is_member_free, is_download_member_free, tags, workflow_file_url, workflow_file_name, workflow_file_size,
          cover_image_url, preview_video_url, preview_images, quick_commands, coze_api,
          status, is_featured, is_official, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, ?, ?, ?)
      `).bind(
        user.id,
        taskId,
        sanitizeInput(title2),
        description ? sanitizeInput(description) : "",
        category_id,
        parseFloat(price.toString()),
        parseFloat(download_price.toString()),
        type ? sanitizeInput(type) : "coze",
        Boolean(isMemberFree),
        Boolean(isDownloadMemberFree),
        JSON.stringify(tags.map((tag) => sanitizeInput(tag))),
        sanitizeInput(fileUrl),
        fileName ? sanitizeInput(fileName) : null,
        fileSize ? parseInt(fileSize.toString()) : null,
        coverImageUrl ? sanitizeInput(coverImageUrl) : null,
        previewVideoUrl ? sanitizeInput(previewVideoUrl) : null,
        previewImages && previewImages.length > 0 ? JSON.stringify(previewImages.map((img) => sanitizeInput(img))) : JSON.stringify([]),
        JSON.stringify(quickCommands.map((cmd) => sanitizeInput(cmd))),
        cozeApi ? sanitizeInput(cozeApi) : null,
        user.role === "admin" || user.role === "super_admin",
        now,
        now
      ).run();
    }
    if (!result.success) {
      return c.json(createErrorResponse(500, "提交工作流失败"), 500);
    }
    return c.json(createSuccessResponse({
      id: existingSubmission ? existingSubmission.id : result.meta?.last_row_id,
      message: existingSubmission ? "工作流更新成功，等待审核" : "工作流提交成功，等待审核"
    }), existingSubmission ? 200 : 201);
  } catch (error) {
    console.error("Submit workflow for task error:", error);
    return c.json(createErrorResponse(500, "提交工作流失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/creator/coze-workflows", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { title: title2, description, category, tags = [], price = 0, download_price = 0, type = "coze", isMemberFree = false, isDownloadMemberFree = false, fileUrl, fileName, fileSize, coverImageUrl, previewImages = [], previewVideoUrl, quickCommands = [], cozeApi } = body;
    if (!title2 || !category || !fileUrl) {
      return c.json(createErrorResponse(400, "缺少必要参数", "form", "标题、分类和文件URL不能为空"), 400);
    }
    if (price < 0 || download_price < 0) {
      return c.json(createErrorResponse(400, "价格不能为负数", "price", "请输入有效的价格"), 400);
    }
    const category_id = parseInt(category) || 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await c.env.DB.prepare(`
      INSERT INTO coze_workflows (
        creator_id, task_id, title, description, category_id, price, download_price,
        type, is_member_free, is_download_member_free, tags, workflow_file_url, workflow_file_name, workflow_file_size,
        cover_image_url, preview_video_url, preview_images, quick_commands, coze_api,
        status, is_featured, is_official, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, ?, ?, ?)
    `).bind(
      user.id,
      null,
      // task_id为null，表示直接上传的工作流
      sanitizeInput(title2),
      description ? sanitizeInput(description) : "",
      category_id,
      parseFloat(price.toString()),
      parseFloat(download_price.toString()),
      type ? sanitizeInput(type) : "coze",
      Boolean(isMemberFree),
      Boolean(isDownloadMemberFree),
      JSON.stringify(tags.map((tag) => sanitizeInput(tag))),
      sanitizeInput(fileUrl),
      fileName ? sanitizeInput(fileName) : null,
      fileSize ? parseInt(fileSize.toString()) : null,
      coverImageUrl ? sanitizeInput(coverImageUrl) : null,
      previewVideoUrl ? sanitizeInput(previewVideoUrl) : null,
      previewImages && previewImages.length > 0 ? JSON.stringify(previewImages.map((img) => sanitizeInput(img))) : JSON.stringify([]),
      JSON.stringify(quickCommands.map((cmd) => sanitizeInput(cmd))),
      cozeApi ? sanitizeInput(cozeApi) : null,
      user.role === "admin" || user.role === "super_admin",
      now,
      now
    ).run();
    if (!result.success) {
      return c.json(createErrorResponse(500, "上传工作流失败"), 500);
    }
    return c.json(createSuccessResponse({
      id: result.meta?.last_row_id,
      message: "工作流上传成功，等待审核"
    }), 201);
  } catch (error) {
    console.error("Upload workflow error:", error);
    return c.json(createErrorResponse(500, "上传工作流失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/creator/coze-workflows", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      creatorId: user.id,
      status: query.status
    };
    const db = new D1Database(c.env);
    const result = await db.getCozeWorkflows(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("获取创作者Coze工作流失败:", error);
    return c.json(createErrorResponse(500, "获取创作者Coze工作流失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/creator/stats", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const db = new D1Database(c.env);
    const workflows = await db.getCozeWorkflows({ creatorId: user.id, pageSize: 1e3 });
    const workflowStats = {
      count: workflows.items.length,
      downloads: workflows.items.reduce((sum, w) => sum + w.download_count, 0),
      totalRating: workflows.items.reduce((sum, w) => sum + w.rating, 0)
    };
    const totalWorks = workflowStats.count;
    const totalDownloads = workflowStats.downloads;
    const totalRatingSum = workflowStats.totalRating;
    const averageRating = totalWorks > 0 ? totalRatingSum / totalWorks : 0;
    const monthlyEarnings = 0;
    console.log("Monthly earnings set to 0 (commission tables removed)");
    const stats = {
      totalEarnings: user.total_earnings,
      monthlyEarnings,
      // 基于实际的本月佣金发放记录
      workflowCount: totalWorks,
      // 工作流总数
      totalDownloads,
      // 工作流下载量
      averageRating
    };
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取创作者统计失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/dashboard", authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = new D1Database(c.env);
    const stats = await db.getDashboardStats();
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取仪表盘数据失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/dashboard/stats", authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = new D1Database(c.env);
    const stats = await db.getDashboardStats();
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取仪表盘统计数据失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      search: query.search,
      role: query.role,
      status: query.status
    };
    const db = new D1Database(c.env);
    const result = await db.getUsers(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取用户列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/users-with-stats", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      search: query.search,
      role: query.role,
      status: query.status
    };
    const db = new D1Database(c.env);
    const result = await db.getUsersWithStats(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取用户统计数据失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/users/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    const db = new D1Database(c.env);
    const user = await db.getUserById(id);
    if (!user) {
      return c.json(createErrorResponse(404, "用户不存在"), 404);
    }
    return c.json(createSuccessResponse(user));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取用户详情失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/users/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    const body = await c.req.json();
    const { username, email, role, status, phone, realName, balance, total_earnings, wh_coins, membership_type, membership_start_date, membership_end_date, membership_auto_renew, avatar_url, oauth_provider, oauth_id, wechat_openid } = body;
    if (username && !validateUsername(username)) {
      return c.json(createErrorResponse(400, "用户名格式错误", "username", "用户名只能包含字母、数字、下划线和中文，长度3-20位"), 400);
    }
    if (email && !validateEmail(email)) {
      return c.json(createErrorResponse(400, "邮箱格式错误", "email", "请输入有效的邮箱地址"), 400);
    }
    if (role && !["user", "creator", "admin", "advertiser", "super_admin"].includes(role)) {
      return c.json(createErrorResponse(400, "无效的角色"), 400);
    }
    if (status && !["active", "banned", "pending", "suspended", "deleted"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的状态"), 400);
    }
    const db = new D1Database(c.env);
    const existingUser = await db.getUserById(id);
    if (!existingUser) {
      return c.json(createErrorResponse(404, "用户不存在"), 404);
    }
    const currentUser = c.get("user");
    if (role && (role === "admin" || role === "super_admin")) {
      if (currentUser.role !== "super_admin") {
        return c.json(createErrorResponse(403, "只有超级管理员可以任命管理员"), 403);
      }
    }
    if (existingUser.role === "admin" || existingUser.role === "super_admin") {
      if (currentUser.role !== "super_admin" || existingUser.role === "super_admin" && currentUser.id !== existingUser.id) {
        return c.json(createErrorResponse(403, "权限不足，无法修改此用户信息"), 403);
      }
    }
    if (role && role !== existingUser.role) {
      await db.updateUserRole(id, role);
    }
    const updateData = {};
    if (username) updateData.username = sanitizeInput(username);
    if (email) updateData.email = sanitizeInput(email);
    if (status) updateData.status = status;
    if (phone !== void 0) updateData.phone = phone ? sanitizeInput(phone) : null;
    if (realName !== void 0) updateData.real_name = realName ? sanitizeInput(realName) : null;
    if (balance !== void 0) updateData.balance = Number(balance) || 0;
    if (total_earnings !== void 0) updateData.total_earnings = Number(total_earnings) || 0;
    if (wh_coins !== void 0) updateData.wh_coins = Number(wh_coins) || 0;
    if (membership_type) updateData.membership_type = membership_type;
    if (membership_start_date !== void 0) updateData.membership_start_date = membership_start_date;
    if (membership_end_date !== void 0) updateData.membership_end_date = membership_end_date;
    if (membership_auto_renew !== void 0) updateData.membership_auto_renew = Number(membership_auto_renew) || 0;
    if (avatar_url !== void 0) updateData.avatar_url = avatar_url;
    if (oauth_provider !== void 0) updateData.oauth_provider = oauth_provider;
    if (oauth_id !== void 0) updateData.oauth_id = oauth_id;
    if (wechat_openid !== void 0) updateData.wechat_openid = wechat_openid;
    if (Object.keys(updateData).length > 0) {
      await db.updateUser(id, updateData);
    }
    const updatedUser = await db.getUserById(id);
    return c.json(createSuccessResponse(updatedUser, "用户信息更新成功"));
  } catch (error) {
    return c.json(createErrorResponse(500, "更新用户信息失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/users/:id/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      console.error("Invalid user ID provided:", c.req.param("id"));
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    const body = await c.req.json();
    const { status } = body;
    console.log(`Attempting to update user ${id} status to ${status}`);
    if (!["active", "banned", "pending", "suspended", "deleted"].includes(status)) {
      console.error("Invalid status value:", status);
      return c.json(createErrorResponse(400, "无效的状态值"), 400);
    }
    const db = new D1Database(c.env);
    const existingUser = await db.getUserById(id);
    if (!existingUser) {
      console.error("User not found:", id);
      return c.json(createErrorResponse(404, "用户不存在"), 404);
    }
    console.log("Current user status:", existingUser.status);
    const currentUser = c.get("user");
    if (existingUser.role === "admin" || existingUser.role === "super_admin") {
      if (currentUser.role !== "super_admin") {
        console.error("Insufficient permissions to modify admin/super_admin status");
        return c.json(createErrorResponse(403, "权限不足，无法修改管理员状态"), 403);
      }
    }
    const user = await db.updateUserStatus(id, status);
    if (!user) {
      console.error("Failed to update user status - user not found after update");
      return c.json(createErrorResponse(404, "用户不存在"), 404);
    }
    console.log("User status updated successfully:", user);
    return c.json(createSuccessResponse(user, "用户状态更新成功"));
  } catch (error) {
    console.error("Error in updateUserStatus endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return c.json(createErrorResponse(500, "更新用户状态失败", "server", `服务器内部错误: ${errorMessage}`), 500);
  }
});
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    const db = new D1Database(c.env);
    const existingUser = await db.getUserById(id);
    if (!existingUser) {
      return c.json(createErrorResponse(404, "用户不存在"), 404);
    }
    const currentUser = c.get("user");
    if (existingUser.role === "admin" || existingUser.role === "super_admin") {
      if (currentUser.role !== "super_admin" || existingUser.role === "super_admin") {
        return c.json(createErrorResponse(403, "不能删除管理员或超级管理员账户"), 403);
      }
    }
    const success = await db.deleteUser(id);
    if (!success) {
      return c.json(createErrorResponse(500, "删除用户失败"), 500);
    }
    return c.json(createSuccessResponse(null, "用户删除成功"));
  } catch (error) {
    return c.json(createErrorResponse(500, "删除用户失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/coze-workflows", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      status: query.status,
      search: query.search,
      category: query.category ? parseInt(query.category) : void 0,
      sortBy: query.sortBy,
      startDate: query.startDate,
      endDate: query.endDate
    };
    const db = new D1Database(c.env);
    const result = await db.getCozeWorkflows(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get coze workflows error:", error);
    return c.json(createErrorResponse(500, "获取Coze工作流列表失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/admin/coze-workflows", authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const currentUser = c.get("user");
    const workflowData = {
      ...body,
      creator_id: body.creator_id || currentUser.id,
      status: "pending"
    };
    const db = new D1Database(c.env);
    const workflow = await db.createCozeWorkflow(workflowData);
    return c.json(createSuccessResponse(workflow, "Coze工作流创建成功"), 201);
  } catch (error) {
    console.error("Create coze workflow error:", error);
    return c.json(createErrorResponse(500, "创建Coze工作流失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/coze-workflows/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的工作流ID"), 400);
    }
    const body = await c.req.json();
    const currentUser = c.get("user");
    const db = new D1Database(c.env);
    const workflow = await db.updateCozeWorkflow(id, body);
    if (!workflow) {
      return c.json(createErrorResponse(404, "工作流不存在"), 404);
    }
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: "update_coze_workflow",
        target_type: "coze_workflow",
        target_id: id,
        details: `更新Coze工作流: ${workflow.title}`
      });
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse(workflow, "Coze工作流更新成功"));
  } catch (error) {
    console.error("Update coze workflow error:", error);
    return c.json(createErrorResponse(500, "更新Coze工作流失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/coze-workflows/:id/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的工作流ID"), 400);
    }
    const body = await c.req.json();
    const { status, reason } = body;
    if (!["pending", "approved", "rejected", "offline"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的状态值"), 400);
    }
    const currentUser = c.get("user");
    const db = new D1Database(c.env);
    const workflow = await db.updateCozeWorkflowStatus(id, status, reason);
    if (!workflow) {
      return c.json(createErrorResponse(404, "工作流不存在"), 404);
    }
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: "update_coze_workflow_status",
        target_type: "coze_workflow",
        target_id: id,
        details: `更新Coze工作流状态: ${workflow.title} -> ${status}${reason ? ` (${reason})` : ""}`
      });
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse(workflow, "Coze工作流状态更新成功"));
  } catch (error) {
    console.error("Update coze workflow status error:", error);
    return c.json(createErrorResponse(500, "更新Coze工作流状态失败", "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/admin/coze-workflows/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的工作流ID"), 400);
    }
    const db = new D1Database(c.env);
    const existingWorkflow = await db.getCozeWorkflowById(id);
    if (!existingWorkflow) {
      return c.json(createErrorResponse(404, "工作流不存在"), 404);
    }
    const currentUser = c.get("user");
    console.log(`开始删除Coze工作流 ${id}: ${existingWorkflow.title}`);
    try {
      const success = await db.deleteCozeWorkflow(id);
      if (!success) {
        console.error(`Failed to delete coze workflow ${id}: deleteCozeWorkflow returned false`);
        console.error(`工作流信息:`, {
          id: existingWorkflow.id,
          title: existingWorkflow.title,
          creator_id: existingWorkflow.creator_id,
          status: existingWorkflow.status
        });
        return c.json(createErrorResponse(500, "删除工作流失败：数据库操作返回失败"), 500);
      }
      console.log(`Coze工作流 ${id} 删除成功`);
    } catch (deleteError) {
      console.error("Delete coze workflow database error:", deleteError);
      console.error("删除错误详情:", {
        workflowId: id,
        workflowTitle: existingWorkflow.title,
        errorType: deleteError instanceof Error ? deleteError.constructor.name : typeof deleteError,
        errorMessage: deleteError instanceof Error ? deleteError.message : String(deleteError),
        errorStack: deleteError instanceof Error ? deleteError.stack : void 0
      });
      try {
        const checkWorkflow = await db.getCozeWorkflowById(id);
        if (!checkWorkflow) {
          console.log(`Coze workflow ${id} was successfully deleted despite error`);
        } else {
          const errorMessage = deleteError instanceof Error ? deleteError.message : "删除工作流失败";
          console.error(`工作流 ${id} 删除失败，工作流仍然存在于数据库中`);
          return c.json(createErrorResponse(500, `删除工作流失败：${errorMessage}`), 500);
        }
      } catch (checkError) {
        console.error("Error checking workflow after delete:", checkError);
        console.error("检查工作流是否存在时发生错误:", {
          checkErrorType: checkError instanceof Error ? checkError.constructor.name : typeof checkError,
          checkErrorMessage: checkError instanceof Error ? checkError.message : String(checkError)
        });
        return c.json(createErrorResponse(500, "删除工作流失败：无法验证删除结果"), 500);
      }
    }
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: "delete_coze_workflow",
        target_type: "coze_workflow",
        target_id: id,
        details: `删除Coze工作流: ${existingWorkflow.title}`
      });
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse(null, "Coze工作流删除成功"));
  } catch (error) {
    console.error("Delete coze workflow error:", error);
    const errorMessage = error instanceof Error ? error.message : "删除Coze工作流失败";
    return c.json(createErrorResponse(500, errorMessage, "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/admin/coze-workflows-legacy/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的工作流ID"), 400);
    }
    const db = new D1Database(c.env);
    const existingWorkflow = await db.getCozeWorkflowById(id);
    if (!existingWorkflow) {
      return c.json(createErrorResponse(404, "工作流不存在"), 404);
    }
    const currentUser = c.get("user");
    const success = await db.deleteCozeWorkflow(id);
    if (!success) {
      return c.json(createErrorResponse(500, "删除工作流失败"), 500);
    }
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: "delete_workflow",
        target_type: "workflow",
        target_id: id,
        details: `删除工作流: ${existingWorkflow.title}`
      });
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse(null, "工作流删除成功"));
  } catch (error) {
    console.error("Delete workflow error:", error);
    return c.json(createErrorResponse(500, "删除工作流失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/creator-applications", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      status: query.status
    };
    const db = new D1Database(c.env);
    const result = await db.getCreatorApplications(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取创作者申请列表失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/creator-applications/:id/review", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { status, admin_comment } = body;
    if (!["approved", "rejected"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的审核状态"), 400);
    }
    const currentUser = c.get("user");
    const db = new D1Database(c.env);
    const application = await db.reviewCreatorApplication(id, {
      status,
      admin_comment,
      reviewed_by: currentUser.id
    });
    if (!application) {
      return c.json(createErrorResponse(404, "创作者申请不存在"), 404);
    }
    return c.json(createSuccessResponse(application, "审核完成"));
  } catch (error) {
    return c.json(createErrorResponse(500, "审核创作者申请失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/upload", authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const uploadType = formData.get("type") || "document";
    if (!file) {
      return c.json(createErrorResponse(400, "未找到上传文件"), 400);
    }
    if (uploadType === "avatar") {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return c.json(createErrorResponse(400, "头像仅支持 JPEG、PNG、GIF、WebP 格式"), 400);
      }
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        return c.json(createErrorResponse(400, "头像文件大小不能超过 2MB"), 400);
      }
    } else {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        return c.json(createErrorResponse(400, "文件大小不能超过 50MB"), 400);
      }
    }
    const user = c.get("user");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "bin";
    const fileName = `${uploadType}s/${uploadType}_${timestamp}_${randomStr}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    const fileUrl = `/api/files/${fileName}`;
    const result = await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      uploadType
    ).run();
    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      url: fileUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    }, "文件上传成功"));
  } catch (error) {
    console.error("Upload error:", error);
    return c.json(createErrorResponse(500, "文件上传失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/upload/avatar-preview", authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file) {
      return c.json(createErrorResponse(400, "未找到上传文件"), 400);
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return c.json(createErrorResponse(400, "头像仅支持 JPEG、PNG、GIF、WebP 格式"), 400);
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, "头像文件大小不能超过 2MB"), 400);
    }
    const user = c.get("user");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `avatars/avatar_preview_${timestamp}_${randomStr}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();
    if (!c.env.R2_BUCKET) {
      console.error("R2_BUCKET binding not found");
      return c.json(createErrorResponse(500, "R2存储桶未配置", "server", "R2存储桶绑定未找到"), 500);
    }
    console.log("Uploading file to R2:", fileName);
    const uploadResult = await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    if (!uploadResult) {
      console.error("Failed to upload file to R2:", fileName);
      return c.json(createErrorResponse(500, "文件上传到R2失败", "server", "R2上传失败"), 500);
    }
    console.log("File uploaded to R2 successfully:", fileName);
    const previewUrl = `/api/files/${fileName}`;
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'preview')
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      previewUrl,
      "avatar"
    ).run();
    console.log("File record saved to database:", fileName);
    return c.json(createSuccessResponse({
      url: previewUrl,
      filename: fileName
    }, "头像预览上传成功"));
  } catch (error) {
    console.error("Avatar preview upload error:", error);
    return c.json(createErrorResponse(500, "头像预览上传失败", "server", "服务器内部错误"), 500);
  }
});
function authorizeFileRequest(filePath, user) {
  if (user && (user.role === "admin" || user.role === "super_admin")) {
    return true;
  }
  const publicFileTypes = ["avatars/", "covers/", "videos/", "images/"];
  for (const publicType of publicFileTypes) {
    if (filePath.startsWith(publicType)) {
      return true;
    }
  }
  const sensitiveFileTypes = ["documents/", "workflows/", "private/"];
  for (const sensitiveType of sensitiveFileTypes) {
    if (filePath.startsWith(sensitiveType)) {
      return !!user;
    }
  }
  return !!user;
}
app.get("/api/files/*", async (c) => {
  try {
    const fullUrl = c.req.url;
    const pathname = new URL(fullUrl).pathname;
    const filePath = pathname.replace("/api/files/", "");
    console.log("=== FILE ACCESS DEBUG ===");
    console.log("Full URL:", fullUrl);
    console.log("Pathname:", pathname);
    console.log("File path extracted:", filePath);
    console.log("Request method:", c.req.method);
    console.log("========================");
    if (!filePath || filePath === "") {
      console.log("ERROR: No file path provided");
      return c.json(createErrorResponse(404, "文件不存在"), 404);
    }
    let user = null;
    try {
      const authHeader = c.req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const db = new D1Database(c.env);
        const authService = new AuthService(c.env, db);
        const payload = await authService.verifyToken(token);
        if (payload) {
          user = await db.getUserById(payload.userId);
          console.log("User authenticated:", { id: user?.id, username: user?.username, role: user?.role });
        }
      }
    } catch (error) {
      console.log("Auth check failed, continuing as anonymous user:", error);
    }
    console.log("Authorization check - filePath:", filePath, "user:", user ? { id: user.id, role: user.role } : "null");
    const isAuthorized = authorizeFileRequest(filePath, user);
    console.log("Authorization result:", isAuthorized);
    if (!isAuthorized) {
      console.log("Access denied for file:", filePath, "user:", user ? { id: user.id, role: user.role } : "null");
      return c.json(createErrorResponse(403, "无权限访问此文件"), 403);
    }
    const sensitiveFileTypes = ["documents/", "workflows/", "private/"];
    const needsOwnershipCheck = sensitiveFileTypes.some((type) => filePath.startsWith(type));
    if (needsOwnershipCheck && user && user.role !== "admin" && user.role !== "super_admin") {
      try {
        const db = new D1Database(c.env);
        const fileRecord = await db.getFileByPath(filePath);
        if (fileRecord && fileRecord.user_id !== user.id) {
          return c.json(createErrorResponse(403, "无权限访问此文件"), 403);
        }
      } catch (error) {
        console.log("File ownership check failed:", error);
      }
    }
    if (!c.env.R2_BUCKET) {
      console.error("R2_BUCKET binding not found");
      return c.json(createErrorResponse(500, "R2存储桶未配置", "server", "R2存储桶绑定未找到"), 500);
    }
    console.log("Attempting to get file from R2:", filePath);
    const object = await c.env.R2_BUCKET.get(filePath);
    if (!object) {
      console.log("File not found in R2:", filePath);
      return c.json(createErrorResponse(404, "文件不存在"), 404);
    }
    console.log("File found, returning content");
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error("File access error:", error);
    return c.json(createErrorResponse(500, "文件访问失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/notifications", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const query = c.req.query();
    const params = {
      recipient_id: user.id,
      is_read: query.is_read === "true" ? true : query.is_read === "false" ? false : void 0,
      type: query.type,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20
    };
    const db = new D1Database(c.env);
    const result = await db.getNotifications(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json(createErrorResponse(500, "获取通知失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/notifications/unread-count", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const db = new D1Database(c.env);
    const count = await db.getUnreadNotificationCount(user.id);
    return c.json(createSuccessResponse({ count }));
  } catch (error) {
    console.error("Get unread count error:", error);
    return c.json(createErrorResponse(500, "获取未读数量失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/notifications/:id/read", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const notificationId = parseInt(c.req.param("id"));
    const db = new D1Database(c.env);
    const notifications = await db.getNotifications({
      recipient_id: user.id,
      page: 1,
      pageSize: 1
    });
    const notification = notifications.items.find((n) => n.id === notificationId);
    if (!notification) {
      return c.json(createErrorResponse(404, "通知不存在或无权限访问"), 404);
    }
    const success = await db.markNotificationAsRead(notificationId);
    if (success) {
      return c.json(createSuccessResponse({ message: "标记成功" }));
    } else {
      return c.json(createErrorResponse(500, "标记失败"), 500);
    }
  } catch (error) {
    console.error("Mark notification read error:", error);
    return c.json(createErrorResponse(500, "标记失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/notifications/read-all", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const db = new D1Database(c.env);
    const success = await db.markAllNotificationsAsRead(user.id);
    if (success) {
      return c.json(createSuccessResponse({ message: "全部标记成功" }));
    } else {
      return c.json(createErrorResponse(500, "标记失败"), 500);
    }
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return c.json(createErrorResponse(500, "标记失败", "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/notifications/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const notificationId = parseInt(c.req.param("id"));
    const db = new D1Database(c.env);
    const notifications = await db.getNotifications({
      recipient_id: user.id,
      page: 1,
      pageSize: 1
    });
    const notification = notifications.items.find((n) => n.id === notificationId);
    if (!notification) {
      return c.json(createErrorResponse(404, "通知不存在或无权限访问"), 404);
    }
    const success = await db.deleteNotification(notificationId);
    if (success) {
      return c.json(createSuccessResponse({ message: "删除成功" }));
    } else {
      return c.json(createErrorResponse(500, "删除失败"), 500);
    }
  } catch (error) {
    console.error("Delete notification error:", error);
    return c.json(createErrorResponse(500, "删除失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/user/settings", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const db = new D1Database(c.env);
    const settings = await db.getUserSettings(user.id);
    if (!settings) {
      const defaultSettings = await db.createOrUpdateUserSettings(user.id, {
        email_notifications: true,
        push_notifications: true,
        welcome_shown: false
      });
      return c.json(createSuccessResponse(defaultSettings));
    }
    return c.json(createSuccessResponse(settings));
  } catch (error) {
    console.error("Get user settings error:", error);
    return c.json(createErrorResponse(500, "获取设置失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/user/settings", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const db = new D1Database(c.env);
    const settings = await db.createOrUpdateUserSettings(user.id, body);
    return c.json(createSuccessResponse(settings));
  } catch (error) {
    console.error("Update user settings error:", error);
    return c.json(createErrorResponse(500, "更新设置失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/user/preferences", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const preferences = await c.env.DB.prepare(`
      SELECT preference_key, preference_value 
      FROM user_preferences 
      WHERE user_id = ?
    `).bind(user.id).all();
    const preferencesObj = {};
    preferences.results.forEach((pref) => {
      preferencesObj[pref.preference_key] = pref.preference_value;
    });
    const defaultPreferences = {
      theme: "dark",
      language: "zh",
      notifications: "enabled"
    };
    const finalPreferences = { ...defaultPreferences, ...preferencesObj };
    return c.json(createSuccessResponse(finalPreferences));
  } catch (error) {
    console.error("Get user preferences error:", error);
    return c.json(createErrorResponse(500, "获取偏好设置失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/user/preferences", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const allowedKeys = ["theme", "language", "notifications"];
    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        await c.env.DB.prepare(`
          INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, preference_key) 
          DO UPDATE SET preference_value = ?, updated_at = datetime('now')
        `).bind(user.id, key, value, value).run();
      }
    }
    const preferences = await c.env.DB.prepare(`
      SELECT preference_key, preference_value 
      FROM user_preferences 
      WHERE user_id = ?
    `).bind(user.id).all();
    const preferencesObj = {};
    preferences.results.forEach((pref) => {
      preferencesObj[pref.preference_key] = pref.preference_value;
    });
    return c.json(createSuccessResponse(preferencesObj));
  } catch (error) {
    console.error("Update user preferences error:", error);
    return c.json(createErrorResponse(500, "更新偏好设置失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/user/preferences/:key", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const key = c.req.param("key");
    const preference = await c.env.DB.prepare(`
      SELECT preference_value 
      FROM user_preferences 
      WHERE user_id = ? AND preference_key = ?
    `).bind(user.id, key).first();
    if (!preference) {
      const defaultValues = {
        theme: "dark",
        language: "zh",
        notifications: "enabled"
      };
      return c.json(createSuccessResponse({ [key]: defaultValues[key] || null }));
    }
    return c.json(createSuccessResponse({ [key]: preference.preference_value }));
  } catch (error) {
    console.error("Get user preference error:", error);
    return c.json(createErrorResponse(500, "获取偏好设置失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/user/preferences/:key", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const key = c.req.param("key");
    const body = await c.req.json();
    const value = body.value;
    if (!value) {
      return c.json(createErrorResponse(400, "偏好设置值不能为空"), 400);
    }
    const allowedKeys = ["theme", "language", "notifications"];
    if (!allowedKeys.includes(key)) {
      return c.json(createErrorResponse(400, "不支持的偏好设置键"), 400);
    }
    await c.env.DB.prepare(`
      INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, preference_key) 
      DO UPDATE SET preference_value = ?, updated_at = datetime('now')
    `).bind(user.id, key, value, value).run();
    return c.json(createSuccessResponse({ [key]: value }));
  } catch (error) {
    console.error("Update user preference error:", error);
    return c.json(createErrorResponse(500, "更新偏好设置失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/creator/apply", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { country, experience, reason, skills } = body;
    if (!country || !experience || !reason || !skills) {
      return c.json(createErrorResponse(400, "请填写所有必填字段"), 400);
    }
    const existingApplication = await c.env.DB.prepare(`
      SELECT id FROM creator_applications WHERE user_id = ?
    `).bind(user.id).first();
    if (existingApplication) {
      return c.json(createErrorResponse(400, "您已经提交过申请，请勿重复提交"), 400);
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO creator_applications (user_id, country, linkedin, experience, portfolio, reason, skills, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(
      user.id,
      country,
      body.linkedin || null,
      experience,
      body.portfolio || null,
      reason,
      skills
    ).run();
    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      status: "pending",
      message: "申请提交成功，请等待审核"
    }), 201);
  } catch (error) {
    console.error("Creator application error:", error);
    return c.json(createErrorResponse(500, "申请提交失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/creator/application", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const application = await c.env.DB.prepare(`
      SELECT * FROM creator_applications WHERE user_id = ?
    `).bind(user.id).first();
    if (!application) {
      return c.json(createSuccessResponse(null));
    }
    return c.json(createSuccessResponse(application));
  } catch (error) {
    console.error("Get application error:", error);
    return c.json(createErrorResponse(500, "获取申请状态失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/creator/application/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const applicationId = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const application = await c.env.DB.prepare(`
      SELECT * FROM creator_applications WHERE id = ? AND user_id = ?
    `).bind(applicationId, user.id).first();
    if (!application) {
      return c.json(createErrorResponse(404, "申请不存在或无权限修改"), 404);
    }
    const { country, experience, reason, skills } = body;
    if (!country || !experience || !reason || !skills) {
      return c.json(createErrorResponse(400, "请填写所有必填字段"), 400);
    }
    await c.env.DB.prepare(`
      UPDATE creator_applications 
      SET country = ?, linkedin = ?, experience = ?, portfolio = ?, reason = ?, skills = ?, 
          status = 'pending', admin_comment = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(
      country,
      body.linkedin || null,
      experience,
      body.portfolio || null,
      reason,
      skills,
      applicationId,
      user.id
    ).run();
    return c.json(createSuccessResponse({ message: "申请更新成功，请等待重新审核" }));
  } catch (error) {
    console.error("Update application error:", error);
    return c.json(createErrorResponse(500, "申请更新失败", "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/creator/application/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const applicationId = parseInt(c.req.param("id"));
    const application = await c.env.DB.prepare(`
      SELECT * FROM creator_applications WHERE id = ? AND user_id = ?
    `).bind(applicationId, user.id).first();
    if (!application) {
      return c.json(createErrorResponse(404, "申请不存在或无权限删除"), 404);
    }
    await c.env.DB.prepare(`
      DELETE FROM creator_applications WHERE id = ? AND user_id = ?
    `).bind(applicationId, user.id).run();
    return c.json(createSuccessResponse({ message: "申请已撤回" }));
  } catch (error) {
    console.error("Withdraw application error:", error);
    return c.json(createErrorResponse(500, "撤回申请失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/creator/upload/workflow", authMiddleware, creatorMiddleware, async (c) => {
  try {
    if (!c.env.R2_BUCKET) {
      return c.json(createErrorResponse(500, "文件存储服务未配置，请联系管理员"), 500);
    }
    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file) {
      return c.json(createErrorResponse(400, "未找到上传文件"), 400);
    }
    const allowedTypes = ["application/zip", "application/x-zip-compressed", "application/octet-stream"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".zip")) {
      return c.json(createErrorResponse(400, "工作流文件仅支持ZIP格式"), 400);
    }
    const maxSize = 100 * 1024;
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, "工作流文件大小不能超过100KB"), 400);
    }
    const user = c.get("user");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `workflows/workflow_${timestamp}_${randomStr}.zip`;
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    const fileUrl = `/api/files/${fileName}`;
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      "workflow"
    ).run();
    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName
    }, "工作流文件上传成功"));
  } catch (error) {
    console.error("Workflow upload error:", error);
    return c.json(createErrorResponse(500, "工作流文件上传失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/creator/upload/ai-app", authMiddleware, creatorMiddleware, async (c) => {
  try {
    if (!c.env.R2_BUCKET) {
      return c.json(createErrorResponse(500, "文件存储服务未配置，请联系管理员"), 500);
    }
    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file) {
      return c.json(createErrorResponse(400, "未找到上传文件"), 400);
    }
    const allowedTypes = ["application/zip", "application/x-zip-compressed", "application/octet-stream"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".zip")) {
      return c.json(createErrorResponse(400, "AI应用文件仅支持ZIP格式"), 400);
    }
    const maxSize = 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, "AI应用文件大小不能超过1GB"), 400);
    }
    const user = c.get("user");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `ai-apps/aiapp_${timestamp}_${randomStr}.zip`;
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    const fileUrl = `/api/files/${fileName}`;
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      "document"
    ).run();
    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName
    }, "AI应用文件上传成功"));
  } catch (error) {
    console.error("AI app upload error:", error);
    return c.json(createErrorResponse(500, "AI应用文件上传失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/creator/upload/cover", authMiddleware, creatorMiddleware, async (c) => {
  try {
    console.log("Cover upload request received");
    if (!c.env.R2_BUCKET) {
      console.error("R2_BUCKET not configured");
      return c.json(createErrorResponse(500, "文件存储服务未配置，请联系管理员"), 500);
    }
    const formData = await c.req.formData();
    const file = formData.get("file");
    console.log("File info:", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });
    if (!file) {
      console.error("No file found in form data");
      return c.json(createErrorResponse(400, "未找到上传文件"), 400);
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return c.json(createErrorResponse(400, `封面图片仅支持 JPEG、PNG、GIF、WebP 格式，当前文件类型：${file.type}`), 400);
    }
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("File too large:", file.size);
      return c.json(createErrorResponse(400, `封面图片大小不能超过1MB，当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`), 400);
    }
    const user = c.get("user");
    console.log("User info:", { id: user?.id, username: user?.username, role: user?.role });
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `covers/cover_${timestamp}_${randomStr}.${fileExtension}`;
    console.log("Generated filename:", fileName);
    console.log("Starting R2 upload...");
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    console.log("R2 upload completed");
    const fileUrl = `/api/files/${fileName}`;
    console.log("Saving file record to database...");
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      "preview"
    ).run();
    console.log("File record saved successfully");
    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName
    }, "封面图片上传成功"));
  } catch (error) {
    console.error("Cover upload error:", error);
    let errorMessage = "封面图片上传失败";
    let statusCode = 500;
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      if (error.message.includes("Invalid JWT") || error.message.includes("token")) {
        errorMessage = "认证失败，请重新登录";
        statusCode = 401;
      } else if (error.message.includes("permission") || error.message.includes("role")) {
        errorMessage = "权限不足，需要创作者权限";
        statusCode = 403;
      } else if (error.message.includes("file") || error.message.includes("upload")) {
        errorMessage = `文件上传失败：${error.message}`;
        statusCode = 400;
      }
    }
    return c.json(createErrorResponse(statusCode, errorMessage, "server", error instanceof Error ? error.message : "服务器内部错误"), statusCode);
  }
});
app.post("/api/creator/upload/preview-video", authMiddleware, creatorMiddleware, async (c) => {
  try {
    if (!c.env.R2_BUCKET) {
      return c.json(createErrorResponse(500, "文件存储服务未配置，请联系管理员"), 500);
    }
    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file) {
      return c.json(createErrorResponse(400, "未找到上传文件"), 400);
    }
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov"];
    if (!allowedTypes.includes(file.type)) {
      return c.json(createErrorResponse(400, "预览视频仅支持 MP4、WebM、OGG、AVI、MOV 格式"), 400);
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, "预览视频大小不能超过50MB"), 400);
    }
    const user = c.get("user");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "mp4";
    const fileName = `videos/video_${timestamp}_${randomStr}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    const fileUrl = `/api/files/${fileName}`;
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      "preview"
    ).run();
    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName,
      compressed: false
    }, "预览视频上传成功"));
  } catch (error) {
    console.error("Video upload error:", error);
    return c.json(createErrorResponse(500, "预览视频上传失败", "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/creator/promotions/:id", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const promotionId = parseInt(c.req.param("id"));
    if (!promotionId || isNaN(promotionId)) {
      return c.json(createErrorResponse(400, "无效的推广ID"), 400);
    }
    const promotion = await c.env.DB.prepare(`
      SELECT id, status FROM advertisements 
      WHERE id = ? AND advertiser_id = ?
    `).bind(promotionId, user.id).first();
    if (!promotion) {
      return c.json(createErrorResponse(404, "推广不存在"), 404);
    }
    if (promotion.status !== "pending") {
      return c.json(createErrorResponse(400, "只有待审核状态的推广可以取消"), 400);
    }
    const result = await c.env.DB.prepare(`
      UPDATE advertisements 
      SET status = 'paused', updated_at = ?
      WHERE id = ? AND advertiser_id = ?
    `).bind((/* @__PURE__ */ new Date()).toISOString(), promotionId, user.id).run();
    if (!result.success) {
      return c.json(createErrorResponse(500, "取消推广失败"), 500);
    }
    return c.json(createSuccessResponse(null, "推广已取消"));
  } catch (error) {
    return c.json(createErrorResponse(500, "取消推广失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/creator/promotion-stats", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_promotions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promotions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_promotions,
        SUM(budget) as total_budget,
        SUM(spent) as total_spent,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks
      FROM advertisements 
      WHERE advertiser_id = ?
    `).bind(user.id).first();
    const statsData = {
      total_promotions: stats?.total_promotions || 0,
      active_promotions: stats?.active_promotions || 0,
      pending_promotions: stats?.pending_promotions || 0,
      total_budget: parseFloat(stats?.total_budget || "0"),
      total_spent: parseFloat(stats?.total_spent || "0"),
      total_impressions: stats?.total_impressions || 0,
      total_clicks: stats?.total_clicks || 0,
      click_rate: stats?.total_impressions > 0 ? (stats?.total_clicks / stats?.total_impressions * 100).toFixed(2) + "%" : "0%"
    };
    return c.json(createSuccessResponse(statsData));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取推广统计失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/user/transactions", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = parseInt(query.pageSize || "20");
    const offset = (page - 1) * pageSize;
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM transactions WHERE user_id = ?
    `).bind(user.id).first();
    const total = countResult?.total || 0;
    const transactions = await c.env.DB.prepare(`
      SELECT 
        t.*,
        NULL as workflow_title
      FROM transactions t
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, pageSize, offset).all();
    const items = transactions.results?.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      status: row.status,
      payment_method: row.payment_method,
      description: row.description || (row.workflow_title ? `购买工作流: ${row.workflow_title}` : ""),
      created_at: row.created_at,
      workflow_id: row.workflow_id,
      workflow_title: row.workflow_title
    })) || [];
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    return c.json(createErrorResponse(500, "获取交易记录失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/user/purchases", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = parseInt(query.pageSize || "20");
    const offset = (page - 1) * pageSize;
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM user_workflows uw
      WHERE uw.user_id = ? AND uw.action = 'purchase'
    `).bind(user.id).first();
    const total = countResult?.total || 0;
    const purchases = await c.env.DB.prepare(`
      SELECT 
        uw.id,
        uw.user_id,
        uw.workflow_id,
        uw.action,
        uw.created_at,
        NULL as title,
        NULL as description,
        NULL as price,
        NULL as preview_images,
        NULL as category_id,
        NULL as category_name
      FROM user_workflows uw
      WHERE uw.user_id = ? AND uw.action = 'purchase'
      ORDER BY uw.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, pageSize, offset).all();
    const items = purchases.results?.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      workflow_id: row.workflow_id,
      action: row.action,
      created_at: row.created_at,
      workflow_title: row.title,
      workflow_description: row.description,
      workflow_price: row.price,
      workflow_preview_images: row.preview_images ? JSON.parse(row.preview_images) : [],
      category_name: row.category_name
    })) || [];
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error("获取购买记录失败:", error);
    return c.json(createErrorResponse(500, "获取购买记录失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/tasks", async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(parseInt(query.pageSize || "20"), 100);
    const offset = (page - 1) * pageSize;
    const search = query.search || "";
    const category = query.category || "";
    let whereConditions = ["t.status = 'active'"];
    let params = [];
    if (search) {
      whereConditions.push("(t.title LIKE ? OR t.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      whereConditions.push("t.category = ?");
      params.push(category);
    }
    const whereClause = whereConditions.join(" AND ");
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM tasks t 
      LEFT JOIN task_claims tc ON t.id = tc.task_id AND tc.status = 'claimed'
      WHERE ${whereClause} AND tc.id IS NULL
    `).bind(...params).first();
    const total = countResult?.total || 0;
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) as submission_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_claims tc ON t.id = tc.task_id AND tc.status = 'claimed'
      WHERE ${whereClause} AND tc.id IS NULL
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    const items = tasks.results?.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      submission_types: row.submission_types ? JSON.parse(row.submission_types) : ["ai_app", "workflow"],
      reward_amount: row.reward_amount,
      reward_type: row.reward_type,
      max_submissions: row.max_submissions,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      priority: row.priority,
      category: row.category,
      tags: row.tags,
      attachment_urls: row.attachment_urls,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_username: row.creator_username,
      submission_count: row.submission_count || 0
    })) || [];
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error("Get tasks error:", error);
    return c.json(createErrorResponse(500, "获取任务列表失败"), 500);
  }
});
app.get("/api/tasks/:id", async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) as submission_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ? AND t.status = 'published'
    `).bind(taskId).first();
    if (!task) {
      return c.json(createErrorResponse(404, "任务不存在或未发布"), 404);
    }
    return c.json(createSuccessResponse(task));
  } catch (error) {
    console.error("Get task detail error:", error);
    return c.json(createErrorResponse(500, "获取任务详情失败"), 500);
  }
});
app.post("/api/tasks/:id/submit", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const body = await c.req.json();
    const { content, attachments } = body;
    if (!content) {
      return c.json(createErrorResponse(400, "提交内容不能为空"), 400);
    }
    const task = await c.env.DB.prepare(`
      SELECT * FROM tasks WHERE id = ? AND status = 'published'
    `).bind(taskId).first();
    if (!task) {
      return c.json(createErrorResponse(404, "任务不存在或未发布"), 404);
    }
    if (task.deadline && new Date(task.deadline) < /* @__PURE__ */ new Date()) {
      return c.json(createErrorResponse(400, "任务已截止"), 400);
    }
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM task_submissions WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).first();
    if (existingSubmission) {
      return c.json(createErrorResponse(400, "您已提交过该任务"), 400);
    }
    const taskClaim = await c.env.DB.prepare(`
      SELECT id FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();
    if (!taskClaim) {
      return c.json(createErrorResponse(400, "您需要先领取该任务才能提交"), 400);
    }
    if (task.max_participants) {
      const totalParticipants = await c.env.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM task_claims WHERE task_id = ?) +
          (SELECT COUNT(*) FROM task_submissions WHERE task_id = ?) as count
      `).bind(taskId, taskId).first();
      if (totalParticipants?.count >= task.max_participants) {
        return c.json(createErrorResponse(400, "任务参与人数已满"), 400);
      }
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO task_submissions (task_id, user_id, content, attachments, status, submitted_at)
      VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      taskId,
      user.id,
      content,
      attachments ? JSON.stringify(attachments) : null
    ).run();
    await c.env.DB.prepare(`
      DELETE FROM task_claims WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).run();
    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      message: "任务提交成功，等待审核"
    }));
  } catch (error) {
    console.error("Submit task error:", error);
    return c.json(createErrorResponse(500, "提交任务失败"), 500);
  }
});
app.get("/api/my-task-submissions", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(parseInt(query.pageSize || "20"), 100);
    const offset = (page - 1) * pageSize;
    const status = query.status || "";
    const task_id = query.task_id ? parseInt(query.task_id) : null;
    let items = [];
    let total = 0;
    if (status === "claimed") {
      let claimQuery = `
        SELECT 
          tc.id as claim_id,
          tc.task_id,
          tc.claimed_at,
          tc.status as claim_status,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types
        FROM task_claims tc
        LEFT JOIN tasks t ON tc.task_id = t.id
        LEFT JOIN coze_workflows cw ON tc.task_id = cw.task_id AND cw.creator_id = tc.user_id
        WHERE tc.user_id = ? AND tc.status = 'claimed' AND cw.id IS NULL
      `;
      let params = [user.id];
      if (task_id) {
        claimQuery += " AND tc.task_id = ?";
        params.push(task_id);
      }
      const countQuery = claimQuery.replace("SELECT \n          tc.id as claim_id,\n          tc.task_id,\n          tc.claimed_at,\n          tc.status as claim_status,\n          t.title as task_title,\n          t.description as task_description,\n          t.reward_amount,\n          t.end_date,\n          t.submission_types", "SELECT COUNT(*) as total");
      const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
      total = countResult?.total || 0;
      claimQuery += " ORDER BY tc.claimed_at DESC LIMIT ? OFFSET ?";
      const results = await c.env.DB.prepare(claimQuery).bind(...params, pageSize, offset).all();
      items = results.results?.map((row) => ({
        id: row.claim_id,
        task_id: row.task_id,
        task_title: row.task_title,
        task_description: row.task_description,
        content: "",
        status: "claimed",
        review_comment: null,
        task_reward_amount: row.reward_amount,
        task_end_date: row.end_date,
        end_date: row.end_date,
        claimed_at: row.claimed_at,
        submitted_at: row.claimed_at,
        created_at: row.claimed_at,
        updated_at: row.claimed_at,
        submission_types: row.submission_types,
        submission_type: null
      })) || [];
    } else if (status && status !== "claimed") {
      let workflowQuery = `
        SELECT 
          cw.id as workflow_id,
          cw.task_id,
          cw.title as workflow_title,
          cw.description as workflow_description,
          cw.status as workflow_status,
          cw.created_at as workflow_created_at,
          cw.updated_at as workflow_updated_at,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        WHERE cw.creator_id = ? AND cw.task_id IS NOT NULL AND cw.status = ?
      `;
      let params = [user.id, status];
      if (task_id) {
        workflowQuery += " AND cw.task_id = ?";
        params.push(task_id);
      }
      const countQuery = workflowQuery.replace("SELECT \n          cw.id as workflow_id,\n          cw.task_id,\n          cw.title as workflow_title,\n          cw.description as workflow_description,\n          cw.status as workflow_status,\n          cw.created_at as workflow_created_at,\n          cw.updated_at as workflow_updated_at,\n          t.title as task_title,\n          t.description as task_description,\n          t.reward_amount,\n          t.end_date,\n          t.submission_types", "SELECT COUNT(*) as total");
      const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
      total = countResult?.total || 0;
      workflowQuery += " ORDER BY cw.created_at DESC LIMIT ? OFFSET ?";
      const results = await c.env.DB.prepare(workflowQuery).bind(...params, pageSize, offset).all();
      items = results.results?.map((row) => ({
        id: row.workflow_id,
        task_id: row.task_id,
        task_title: row.task_title,
        task_description: row.task_description,
        content: row.workflow_description || "",
        status: row.workflow_status === "online" ? "approved" : row.workflow_status,
        review_comment: null,
        task_reward_amount: row.reward_amount,
        task_end_date: row.end_date,
        end_date: row.end_date,
        claimed_at: null,
        submitted_at: row.workflow_created_at,
        created_at: row.workflow_created_at,
        updated_at: row.workflow_updated_at,
        submission_types: row.submission_types,
        submission_type: "workflow"
      })) || [];
    } else {
      const claimQuery = `
        SELECT 
          tc.id as claim_id,
          tc.task_id,
          tc.claimed_at,
          'claimed' as status,
          NULL as review_comment,
          tc.claimed_at as submission_created_at,
          NULL as submission_type,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types,
          tc.claimed_at as sort_date
        FROM task_claims tc
        LEFT JOIN tasks t ON tc.task_id = t.id
        LEFT JOIN coze_workflows cw ON tc.task_id = cw.task_id AND cw.creator_id = tc.user_id
        WHERE tc.user_id = ? AND tc.status = 'claimed' AND cw.id IS NULL
      `;
      const workflowQuery = `
        SELECT 
          cw.id as workflow_id,
          cw.task_id,
          cw.description as workflow_description,
          cw.status,
          NULL as review_comment,
          cw.created_at as submission_created_at,
          'workflow' as submission_type,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types,
          cw.created_at as sort_date
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        WHERE cw.creator_id = ? AND cw.task_id IS NOT NULL
      `;
      let params = [user.id];
      let taskFilter = "";
      if (task_id) {
        taskFilter = " AND tc.task_id = ?";
        params.push(task_id);
      }
      const unionQuery = `
        SELECT * FROM (
          ${claimQuery}${taskFilter}
          UNION ALL
          ${workflowQuery}${task_id ? " AND cw.task_id = ?" : ""}
        ) combined
        ORDER BY sort_date DESC
      `;
      let unionParams = [user.id];
      if (task_id) {
        unionParams.push(task_id, user.id, task_id);
      } else {
        unionParams.push(user.id);
      }
      const countQuery = `SELECT COUNT(*) as total FROM (${unionQuery.replace("ORDER BY sort_date DESC", "")}) counted`;
      const countResult = await c.env.DB.prepare(countQuery).bind(...unionParams).first();
      total = countResult?.total || 0;
      const paginatedQuery = unionQuery + " LIMIT ? OFFSET ?";
      const results = await c.env.DB.prepare(paginatedQuery).bind(...unionParams, pageSize, offset).all();
      items = results.results?.map((row) => ({
        id: row.workflow_id || row.claim_id,
        task_id: row.task_id,
        task_title: row.task_title,
        task_description: row.task_description,
        content: row.workflow_description || "",
        status: row.status === "online" ? "approved" : row.status,
        review_comment: row.review_comment,
        task_reward_amount: row.reward_amount,
        task_end_date: row.end_date,
        end_date: row.end_date,
        claimed_at: row.status === "claimed" ? row.submission_created_at : null,
        submitted_at: row.submission_created_at,
        created_at: row.submission_created_at,
        updated_at: row.submission_created_at,
        submission_types: row.submission_types,
        submission_type: row.submission_type
      })) || [];
    }
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error("Get my task submissions error:", error);
    return c.json(createErrorResponse(500, "获取我的任务记录失败"), 500);
  }
});
app.get("/api/my-task-submissions/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const submissionId = parseInt(c.req.param("id"));
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, "无效的提交ID"), 400);
    }
    const submission = await c.env.DB.prepare(`
      SELECT 
        ts.*,
        t.title as task_title,
        t.description as task_description,
        t.reward_amount,
        t.requirements,
        t.submission_format
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      WHERE ts.id = ? AND ts.user_id = ?
    `).bind(submissionId, user.id).first();
    if (!submission) {
      return c.json(createErrorResponse(404, "提交记录不存在"), 404);
    }
    const result = {
      ...submission,
      attachments: submission.attachments ? JSON.parse(submission.attachments) : []
    };
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get my task submission detail error:", error);
    return c.json(createErrorResponse(500, "获取提交详情失败"), 500);
  }
});
app.put("/api/my-task-submissions/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const submissionId = parseInt(c.req.param("id"));
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, "无效的提交ID"), 400);
    }
    const body = await c.req.json();
    const { content, attachments } = body;
    if (!content) {
      return c.json(createErrorResponse(400, "提交内容不能为空"), 400);
    }
    const submission = await c.env.DB.prepare(`
      SELECT ts.*, t.deadline FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      WHERE ts.id = ? AND ts.user_id = ?
    `).bind(submissionId, user.id).first();
    if (!submission) {
      return c.json(createErrorResponse(404, "提交记录不存在"), 404);
    }
    if (submission.status !== "pending") {
      return c.json(createErrorResponse(400, "只能修改待审核的提交"), 400);
    }
    if (submission.deadline && new Date(submission.deadline) < /* @__PURE__ */ new Date()) {
      return c.json(createErrorResponse(400, "任务已截止，无法修改"), 400);
    }
    await c.env.DB.prepare(`
      UPDATE task_submissions SET
        content = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      content,
      attachments ? JSON.stringify(attachments) : null,
      submissionId
    ).run();
    return c.json(createSuccessResponse({ message: "提交更新成功" }));
  } catch (error) {
    console.error("Update my task submission error:", error);
    return c.json(createErrorResponse(500, "更新提交失败"), 500);
  }
});
app.delete("/api/my-task-submissions/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const claim = await c.env.DB.prepare(`
      SELECT * FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();
    if (!claim) {
      return c.json(createErrorResponse(404, "任务记录不存在"), 404);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT * FROM coze_workflows WHERE task_id = ? AND creator_id = ?
    `).bind(taskId, user.id).first();
    if (workflow && workflow.status !== "pending") {
      return c.json(createErrorResponse(400, "只能撤回待审核的提交"), 400);
    }
    await c.env.DB.prepare("DELETE FROM task_claims WHERE task_id = ? AND user_id = ?").bind(taskId, user.id).run();
    if (workflow) {
      await c.env.DB.prepare("DELETE FROM coze_workflows WHERE task_id = ? AND creator_id = ?").bind(taskId, user.id).run();
    }
    return c.json(createSuccessResponse({ message: "提交撤回成功" }));
  } catch (error) {
    console.error("Withdraw my task submission error:", error);
    return c.json(createErrorResponse(500, "撤回提交失败"), 500);
  }
});
app.get("/api/tasks/:id/participation", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const submission = await c.env.DB.prepare(`
      SELECT id, status FROM task_submissions WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).first();
    if (submission) {
      return c.json(createSuccessResponse({
        participated: true,
        submission_id: submission.id,
        status: submission.status
      }));
    } else {
      return c.json(createSuccessResponse({
        participated: false
      }));
    }
  } catch (error) {
    console.error("Check task participation error:", error);
    return c.json(createErrorResponse(500, "检查参与状态失败"), 500);
  }
});
app.get("/api/tasks/:id/workflow", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT * FROM coze_workflows 
      WHERE task_id = ? AND creator_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(taskId, user.id).first();
    if (!workflow) {
      return c.json(createSuccessResponse(null));
    }
    const workflowData = {
      id: workflow.id,
      creator_id: workflow.creator_id,
      title: workflow.title,
      description: workflow.description || "",
      category_id: workflow.category_id,
      subcategory_id: workflow.subcategory_id,
      price: workflow.price || 0,
      is_member_free: Boolean(workflow.is_member_free),
      workflow_file_url: workflow.workflow_file_url,
      workflow_file_name: workflow.workflow_file_name,
      workflow_file_size: workflow.workflow_file_size,
      cover_image_url: workflow.cover_image_url,
      preview_video_url: workflow.preview_video_url,
      preview_images: workflow.preview_images ? JSON.parse(workflow.preview_images) : [],
      tags: workflow.tags ? JSON.parse(workflow.tags) : [],
      like_count: workflow.like_count || 0,
      favorite_count: workflow.favorite_count || 0,
      download_count: workflow.download_count || 0,
      view_count: workflow.view_count || 0,
      comment_count: workflow.comment_count || 0,
      status: workflow.status,
      is_featured: Boolean(workflow.is_featured),
      is_official: Boolean(workflow.is_official),
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      coze_api: workflow.coze_api,
      task_id: workflow.task_id,
      quick_commands: workflow.quick_commands ? JSON.parse(workflow.quick_commands) : [],
      type: workflow.type || "coze",
      download_price: workflow.download_price || 0,
      is_download_member_free: Boolean(workflow.is_download_member_free)
    };
    return c.json(createSuccessResponse(workflowData));
  } catch (error) {
    console.error("Get task workflow error:", error);
    return c.json(createErrorResponse(500, "获取工作流数据失败"), 500);
  }
});
app.post("/api/tasks/:id/claim", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const task = await c.env.DB.prepare(`
      SELECT * FROM tasks WHERE id = ? AND status = 'active'
    `).bind(taskId).first();
    if (!task) {
      return c.json(createErrorResponse(404, "任务不存在或不可领取"), 404);
    }
    if (task.end_date && new Date(task.end_date) < /* @__PURE__ */ new Date()) {
      return c.json(createErrorResponse(400, "任务已过期"), 400);
    }
    const existingClaim = await c.env.DB.prepare(`
      SELECT id FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();
    if (existingClaim) {
      return c.json(createErrorResponse(400, "您已经领取过该任务"), 400);
    }
    if (task.max_submissions) {
      const claimCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM task_claims WHERE task_id = ? AND status = 'claimed'
      `).bind(taskId).first();
      if (claimCount?.count >= task.max_submissions) {
        return c.json(createErrorResponse(400, "任务参与人数已满"), 400);
      }
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO task_claims (task_id, user_id, status, claimed_at, created_at, updated_at)
      VALUES (?, ?, 'claimed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(taskId, user.id).run();
    return c.json(createSuccessResponse({
      success: true,
      message: "任务领取成功！请及时提交任务内容",
      claim_id: result.meta.last_row_id
    }));
  } catch (error) {
    console.error("Claim task error:", error);
    return c.json(createErrorResponse(500, "领取任务失败"), 500);
  }
});
app.delete("/api/tasks/:id/claim", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const existingClaim = await c.env.DB.prepare(`
      SELECT id FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();
    if (!existingClaim) {
      return c.json(createErrorResponse(404, "您尚未领取该任务"), 404);
    }
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM task_submissions WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).first();
    if (existingSubmission) {
      return c.json(createErrorResponse(400, "任务已提交，无法取消领取"), 400);
    }
    await c.env.DB.prepare(`
      DELETE FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).run();
    return c.json(createSuccessResponse({
      success: true,
      message: "任务领取已取消，任务重新开放给其他用户"
    }));
  } catch (error) {
    console.error("Cancel task claim error:", error);
    return c.json(createErrorResponse(500, "取消任务领取失败"), 500);
  }
});
app.get("/api/my-task-stats", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_participated,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_submissions,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_submissions,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_submissions,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN (SELECT reward_amount FROM tasks WHERE id = ts.task_id) ELSE 0 END), 0) as total_earnings
      FROM task_submissions ts
      WHERE ts.user_id = ?
    `).bind(user.id).first();
    return c.json(createSuccessResponse({
      total_participated: stats?.total_participated || 0,
      pending_submissions: stats?.pending_submissions || 0,
      approved_submissions: stats?.approved_submissions || 0,
      rejected_submissions: stats?.rejected_submissions || 0,
      total_earnings: stats?.total_earnings || 0
    }));
  } catch (error) {
    console.error("Get my task stats error:", error);
    return c.json(createErrorResponse(500, "获取任务统计失败"), 500);
  }
});
app.get("/api/coze-workflows", async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      category: query.category ? parseInt(query.category) : void 0,
      status: query.status || "approved",
      featured: query.featured === "true" ? true : void 0,
      search: query.search,
      sortBy: query.sortBy || "hot"
    };
    const db = new D1Database(c.env);
    const result = await db.getCozeWorkflows(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("获取Coze工作流列表失败:", error);
    return c.json(createErrorResponse(500, "获取Coze工作流列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/coze-workflows/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const db = new D1Database(c.env);
    const workflow = await db.getCozeWorkflowById(id);
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const authHeader = c.req.header("Authorization");
    let user = null;
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const auth = new AuthService(c.env, db);
        const authResult = await auth.verifyToken(token);
        if (authResult) {
          user = await db.getUserById(authResult.userId);
        }
      } catch (error) {
      }
    }
    if (workflow.status !== "online") {
      if (!user) {
        return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
      }
      const canViewPending = user.role === "admin" || user.role === "super_admin" || user.role === "creator" && workflow.creator_id === user.id;
      if (!canViewPending) {
        return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
      }
    }
    return c.json(createSuccessResponse(workflow));
  } catch (error) {
    console.error("获取Coze工作流详情失败:", error);
    return c.json(createErrorResponse(500, "获取Coze工作流详情失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/coze-workflows/:id/view", async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(`
      UPDATE coze_workflows 
      SET view_count = view_count + 1, updated_at = ?
      WHERE id = ?
    `).bind(now, workflowId).run();
    const updatedWorkflow = await c.env.DB.prepare(`
      SELECT view_count FROM coze_workflows WHERE id = ?
    `).bind(workflowId).first();
    return c.json(createSuccessResponse({
      success: true,
      message: "Coze工作流浏览量记录成功",
      view_count: updatedWorkflow?.view_count || 0
    }));
  } catch (error) {
    console.error("Record coze workflow view error:", error);
    return c.json(createErrorResponse(500, "记录Coze工作流浏览量失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/coze-workflows/:id/status", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id, price, download_price, is_member_free, is_download_member_free FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const likeRecord = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_likes 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();
    const favoriteRecord = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_favorites 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();
    const purchaseRecord = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_purchases 
      WHERE workflow_id = ? AND user_id = ? AND status = 'completed'
    `).bind(workflowId, user.id).first();
    const workflowData = workflow;
    const isDownloadFree = workflowData.is_download_member_free || (workflowData.download_price || 0) === 0;
    const isPurchased = !!purchaseRecord || isDownloadFree;
    return c.json(createSuccessResponse({
      liked: !!likeRecord,
      favorited: !!favoriteRecord,
      purchased: isPurchased
    }));
  } catch (error) {
    console.error("获取用户Coze工作流状态失败:", error);
    return c.json(createErrorResponse(500, "获取用户状态失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/coze-workflows/:id/like", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const existingLike = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_likes 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let liked = false;
    if (existingLike) {
      await c.env.DB.prepare(`
        DELETE FROM coze_workflow_likes 
        WHERE workflow_id = ? AND user_id = ?
      `).bind(workflowId, user.id).run();
      await c.env.DB.prepare(`
        UPDATE coze_workflows 
        SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END, updated_at = ?
        WHERE id = ?
      `).bind(now, workflowId).run();
      liked = false;
    } else {
      await c.env.DB.prepare(`
        INSERT INTO coze_workflow_likes (workflow_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).bind(workflowId, user.id, now).run();
      await c.env.DB.prepare(`
        UPDATE coze_workflows 
        SET like_count = like_count + 1, updated_at = ?
        WHERE id = ?
      `).bind(now, workflowId).run();
      liked = true;
    }
    return c.json(createSuccessResponse({
      success: true,
      message: liked ? "Coze工作流点赞成功" : "Coze工作流取消点赞成功",
      liked
    }));
  } catch (error) {
    console.error("Coze工作流点赞操作失败:", error);
    return c.json(createErrorResponse(500, "点赞操作失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/coze-workflows/:id/favorite", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const existingFavorite = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_favorites 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let favorited = false;
    if (existingFavorite) {
      await c.env.DB.prepare(`
        DELETE FROM coze_workflow_favorites 
        WHERE workflow_id = ? AND user_id = ?
      `).bind(workflowId, user.id).run();
      favorited = false;
    } else {
      await c.env.DB.prepare(`
        INSERT INTO coze_workflow_favorites (workflow_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).bind(workflowId, user.id, now).run();
      favorited = true;
    }
    return c.json(createSuccessResponse({
      success: true,
      message: favorited ? "Coze工作流收藏成功" : "Coze工作流取消收藏成功",
      favorited
    }));
  } catch (error) {
    console.error("Coze工作流收藏操作失败:", error);
    return c.json(createErrorResponse(500, "收藏操作失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/coze-workflows/:id/purchase", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    const body = await c.req.json();
    const paymentMethod = body.payment_method || "wh_coins";
    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id, title, download_price, is_download_member_free, creator_id 
      FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const workflowData = workflow;
    const downloadPrice = workflowData.download_price || 0;
    const isDownloadFree = workflowData.is_download_member_free || downloadPrice === 0;
    const existingPurchase = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_purchases 
      WHERE workflow_id = ? AND user_id = ? AND status = 'completed'
    `).bind(workflowId, user.id).first();
    if (existingPurchase || isDownloadFree) {
      return c.json(createSuccessResponse({
        success: true,
        message: "工作流已购买或免费",
        wh_coins_used: 0,
        remaining_balance: 0
      }));
    }
    const userBalance = await c.env.DB.prepare(`
      SELECT wh_coins FROM users WHERE id = ?
    `).bind(user.id).first();
    const currentBalance = userBalance?.wh_coins || 0;
    if (currentBalance < downloadPrice) {
      return c.json(createErrorResponse(400, "WH币余额不足"), 400);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await c.env.DB.prepare(`
        UPDATE users 
        SET wh_coins = wh_coins - ?, updated_at = ?
        WHERE id = ?
      `).bind(downloadPrice, now, user.id).run();
      const purchaseResult = await c.env.DB.prepare(`
        INSERT INTO coze_workflow_purchases (workflow_id, user_id, amount, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, 'completed', ?)
      `).bind(workflowId, user.id, downloadPrice, paymentMethod, now).run();
      await c.env.DB.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, status, created_at)
        VALUES (?, 'purchase', ?, ?, 'completed', ?)
      `).bind(user.id, downloadPrice, `购买Coze工作流: ${workflowData.title}`, now).run();
      if (workflowData.creator_id !== user.id) {
        const commission = Math.floor(downloadPrice * 0.7);
        await c.env.DB.prepare(`
          UPDATE users 
          SET wh_coins = wh_coins + ?, updated_at = ?
          WHERE id = ?
        `).bind(commission, now, workflowData.creator_id).run();
        await c.env.DB.prepare(`
          INSERT INTO transactions (user_id, type, amount, description, status, created_at)
          VALUES (?, 'commission', ?, ?, 'completed', ?)
        `).bind(workflowData.creator_id, commission, `Coze工作流销售分成: ${workflowData.title}`, now).run();
      }
      const updatedBalance = await c.env.DB.prepare(`
        SELECT wh_coins FROM users WHERE id = ?
      `).bind(user.id).first();
      return c.json(createSuccessResponse({
        success: true,
        message: "购买成功",
        transaction_id: purchaseResult.meta.last_row_id,
        wh_coins_used: downloadPrice,
        remaining_balance: updatedBalance?.wh_coins || 0,
        workflow_title: workflowData.title
      }));
    } catch (transactionError) {
      console.error("购买事务处理失败:", transactionError);
      return c.json(createErrorResponse(500, "购买处理失败，请稍后重试"), 500);
    }
  } catch (error) {
    console.error("Coze工作流购买失败:", error);
    return c.json(createErrorResponse(500, "购买失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/coze-workflows/:id/download", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id, title, file_url, file_name, download_price, is_download_member_free 
      FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const workflowData = workflow;
    const downloadPrice = workflowData.download_price || 0;
    const isDownloadFree = workflowData.is_download_member_free || downloadPrice === 0;
    if (!isDownloadFree) {
      const purchaseRecord = await c.env.DB.prepare(`
        SELECT id FROM coze_workflow_purchases 
        WHERE workflow_id = ? AND user_id = ? AND status = 'completed'
      `).bind(workflowId, user.id).first();
      if (!purchaseRecord) {
        return c.json(createErrorResponse(403, "请先购买此工作流"), 403);
      }
    }
    if (!workflowData.file_url) {
      return c.json(createErrorResponse(404, "文件不存在"), 404);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(`
      UPDATE coze_workflows 
      SET download_count = download_count + 1, updated_at = ?
      WHERE id = ?
    `).bind(now, workflowId).run();
    await c.env.DB.prepare(`
      INSERT INTO coze_workflow_downloads (workflow_id, user_id, created_at)
      VALUES (?, ?, ?)
    `).bind(workflowId, user.id, now).run();
    return c.json(createSuccessResponse({
      success: true,
      message: "下载链接获取成功",
      download_url: workflowData.file_url,
      filename: workflowData.file_name || `${workflowData.title}.zip`
    }));
  } catch (error) {
    console.error("Coze工作流下载失败:", error);
    return c.json(createErrorResponse(500, "下载失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/coze-workflows/:id/comments", async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    if (isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.username,
        u.avatar_url,
        (
          SELECT COUNT(*) FROM coze_workflow_comments 
          WHERE parent_id = c.id
        ) as reply_count
      FROM coze_workflow_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.coze_workflow_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT 50
    `).bind(workflowId).all();
    const formattedComments = comments.results.map((comment) => ({
      id: comment.id,
      content: comment.content,
      like_count: comment.like_count || 0,
      reply_count: comment.reply_count || 0,
      created_at: comment.created_at,
      user: {
        username: comment.username || "匿名用户",
        avatar_url: comment.avatar_url
      }
    }));
    return c.json(createSuccessResponse({
      posts: formattedComments
    }));
  } catch (error) {
    console.error("获取Coze工作流评论失败:", error);
    return c.json(createErrorResponse(500, "获取评论失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/coze-workflows/:id/comments", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    const body = await c.req.json();
    const { content, parent_id } = body;
    if (isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的Coze工作流ID"), 400);
    }
    if (!content || !content.trim()) {
      return c.json(createErrorResponse(400, "评论内容不能为空"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在"), 404);
    }
    if (parent_id) {
      const parentComment = await c.env.DB.prepare(`
        SELECT id FROM coze_workflow_comments 
        WHERE id = ? AND coze_workflow_id = ?
      `).bind(parent_id, workflowId).first();
      if (!parentComment) {
        return c.json(createErrorResponse(404, "父评论不存在"), 404);
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await c.env.DB.prepare(`
      INSERT INTO coze_workflow_comments (coze_workflow_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(workflowId, user.id, content.trim(), parent_id || null, now, now).run();
    const newComment = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.username,
        u.avatar_url
      FROM coze_workflow_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first();
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      like_count: newComment.like_count || 0,
      reply_count: 0,
      created_at: newComment.created_at,
      user: {
        username: newComment.username || "匿名用户",
        avatar_url: newComment.avatar_url
      }
    };
    return c.json(createSuccessResponse(formattedComment));
  } catch (error) {
    console.error("创建Coze工作流评论失败:", error);
    return c.json(createErrorResponse(500, "创建评论失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/wechat/pay/h5", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log("微信H5支付请求:", body);
    const orderInfo = {
      id: body.out_trade_no || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name || body.description || "工作流购买",
      description: body.description,
      price: body.price || 0.01
      // 前端传递的价格已经是以元为单位
    };
    return await WechatPayService.handleH5Payment(c, orderInfo);
  } catch (error) {
    console.error("微信H5支付API错误:", error);
    return c.json(createErrorResponse(500, "微信H5支付失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/wechat/pay/native", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log("微信Native支付请求:", body);
    const orderInfo = {
      id: body.out_trade_no || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name || body.description || "工作流购买",
      description: body.description,
      price: body.price || 0.01
      // 前端传递的价格已经是以元为单位
    };
    return await WechatPayService.handleNativePayment(c, orderInfo);
  } catch (error) {
    console.error("微信Native支付API错误:", error);
    return c.json(createErrorResponse(500, "微信Native支付失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/wechat/pay/notify", async (c) => {
  return await WechatPayService.handlePaymentNotify(c);
});
app.get("/api/wechat/pay/query/:tradeNo", authMiddleware, async (c) => {
  try {
    const tradeNo = c.req.param("tradeNo");
    return await WechatPayService.handlePaymentQuery(c, tradeNo);
  } catch (error) {
    console.error("查询支付状态错误:", error);
    return c.json(createErrorResponse(500, "查询支付状态失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/wechat/pay/unified", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log("统一微信支付请求:", body);
    const user = c.get("user");
    if (!user) {
      return c.json(createErrorResponse(401, "用户未认证"), 401);
    }
    if (!body.price || body.price <= 0) {
      return c.json(createErrorResponse(400, "价格信息无效", "price", "价格必须大于0"), 400);
    }
    const normalizeMembershipPeriod = (period) => {
      if (period === "月" || period === "month") return "month";
      if (period === "年" || period === "year") return "year";
      return "month";
    };
    const extractMembershipInfo = (planId) => {
      let membershipType = "basic";
      let period = "month";
      if (planId.includes("light")) {
        membershipType = "basic";
      } else if (planId.includes("basic")) {
        membershipType = "basic";
      } else if (planId.includes("professional")) {
        membershipType = "premium";
      }
      if (planId.includes("yearly")) {
        period = "year";
      }
      return { membershipType, period };
    };
    const membershipInfo = extractMembershipInfo(body.id || body.membership_type || "basic");
    const finalMembershipType = body.membership_type || membershipInfo.membershipType;
    const finalPeriod = body.membership_period || body.period || membershipInfo.period;
    console.log("会员信息解析:", {
      planId: body.id,
      extractedInfo: membershipInfo,
      finalMembershipType,
      finalPeriod
    });
    const orderInfo = {
      id: body.out_trade_no || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.description || body.name || "工作流购买",
      description: body.description || `${body.name || "工作流"}购买`,
      price: body.price
      // 前端传递的价格已经是转换后的人民币金额（元）
    };
    console.log("处理后的订单信息:", orderInfo);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(`
      INSERT INTO orders (
        user_id, out_trade_no, order_type, membership_type, membership_period,
        amount, currency, payment_status, order_title, order_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      orderInfo.id,
      body.order_type || "membership",
      finalMembershipType,
      normalizeMembershipPeriod(finalPeriod),
      orderInfo.price,
      "CNY",
      "pending",
      orderInfo.name,
      orderInfo.description,
      now,
      now
    ).run();
    console.log("订单已保存到数据库:", { outTradeNo: orderInfo.id, userId: user.id });
    return await WechatPayService.handleAutoPayment(c, orderInfo);
  } catch (error) {
    console.error("统一微信支付API错误:", error);
    return c.json(createErrorResponse(500, "微信支付失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/orders", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "20");
    const status = c.req.query("status");
    const orderType = c.req.query("orderType");
    const search = c.req.query("search");
    const conditions = [];
    const bindings = [];
    if (status && status !== "all") {
      conditions.push("o.payment_status = ?");
      bindings.push(status);
    }
    if (orderType && orderType !== "all") {
      conditions.push("o.order_type = ?");
      bindings.push(orderType);
    }
    if (search) {
      conditions.push("(o.out_trade_no LIKE ? OR u.username LIKE ? OR u.email LIKE ?)");
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `).bind(...bindings).first();
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    const orders = await c.env.DB.prepare(`
      SELECT 
        o.*,
        u.username,
        u.email,
        u.avatar_url
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();
    const items = orders.results?.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      out_trade_no: row.out_trade_no,
      transaction_id: row.transaction_id,
      order_type: row.order_type,
      membership_type: row.membership_type,
      membership_period: row.membership_period,
      amount: parseFloat(row.amount || "0"),
      currency: row.currency,
      payment_status: row.payment_status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        username: row.username,
        email: row.email,
        avatar_url: row.avatar_url
      }
    })) || [];
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return c.json(createErrorResponse(500, "获取订单列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/orders/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const orderId = parseInt(c.req.param("id"));
    if (!orderId || isNaN(orderId)) {
      return c.json(createErrorResponse(400, "无效的订单ID"), 400);
    }
    const order = await c.env.DB.prepare(`
      SELECT 
        o.*,
        u.username,
        u.email,
        u.avatar_url,
        u.membership_type as current_membership_type,
        u.membership_start_date as current_membership_start_date,
        u.membership_end_date as current_membership_end_date
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).bind(orderId).first();
    if (!order) {
      return c.json(createErrorResponse(404, "订单不存在"), 404);
    }
    const row = order;
    const orderDetail = {
      id: row.id,
      user_id: row.user_id,
      out_trade_no: row.out_trade_no,
      transaction_id: row.transaction_id,
      order_type: row.order_type,
      membership_type: row.membership_type,
      membership_period: row.membership_period,
      amount: parseFloat(row.amount || "0"),
      currency: row.currency,
      payment_status: row.payment_status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        username: row.username,
        email: row.email,
        avatar_url: row.avatar_url,
        current_membership_type: row.current_membership_type,
        current_membership_start_date: row.current_membership_start_date,
        current_membership_end_date: row.current_membership_end_date
      }
    };
    return c.json(createSuccessResponse(orderDetail));
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return c.json(createErrorResponse(500, "获取订单详情失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/orders/:id/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const orderId = parseInt(c.req.param("id"));
    const body = await c.req.json();
    if (!orderId || isNaN(orderId)) {
      return c.json(createErrorResponse(400, "无效的订单ID"), 400);
    }
    const { status, payment_status } = body;
    const finalStatus = status || payment_status;
    if (!finalStatus || !["pending", "paid", "failed", "cancelled", "refunded"].includes(finalStatus)) {
      return c.json(createErrorResponse(400, "无效的支付状态"), 400);
    }
    const existingOrder = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(orderId).first();
    if (!existingOrder) {
      return c.json(createErrorResponse(404, "订单不存在"), 404);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(`
      UPDATE orders 
      SET payment_status = ?, updated_at = ?
      WHERE id = ?
    `).bind(finalStatus, now, orderId).run();
    if (finalStatus === "paid" && existingOrder.order_type === "membership") {
      await WechatPayService.updateUserMembership(
        c,
        existingOrder.user_id,
        existingOrder.membership_type,
        existingOrder.membership_period
      );
    }
    return c.json(createSuccessResponse({ message: "订单状态更新成功" }));
  } catch (error) {
    console.error("更新订单状态失败:", error);
    return c.json(createErrorResponse(500, "更新订单状态失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/servers", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const search = c.req.query("search") || "";
    const server_type = c.req.query("server_type");
    const status = c.req.query("status");
    const db = new D1Database(c.env);
    const result = await db.getServers({
      page,
      pageSize,
      search,
      server_type,
      status
    });
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("获取服务器列表失败:", error);
    return c.json(createErrorResponse(500, "获取服务器列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/servers/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const serverId = parseInt(c.req.param("id"));
    if (!serverId || isNaN(serverId)) {
      return c.json(createErrorResponse(400, "无效的服务器ID"), 400);
    }
    const db = new D1Database(c.env);
    const server = await db.getServerById(serverId);
    if (!server) {
      return c.json(createErrorResponse(404, "服务器不存在"), 404);
    }
    return c.json(createSuccessResponse(server));
  } catch (error) {
    console.error("获取服务器详情失败:", error);
    return c.json(createErrorResponse(500, "获取服务器详情失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/admin/servers", authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const {
      name,
      url,
      description,
      server_type,
      location,
      max_users,
      cpu_cores,
      memory_gb,
      storage_gb,
      bandwidth_mbps
    } = body;
    if (!name || !url || !server_type) {
      return c.json(createErrorResponse(400, "缺少必填字段"), 400);
    }
    const db = new D1Database(c.env);
    const serverId = await db.createServer({
      name: sanitizeInput(name),
      url: sanitizeInput(url),
      description: sanitizeInput(description || ""),
      server_type,
      location: sanitizeInput(location || ""),
      max_users: parseInt(max_users || "0"),
      cpu_cores: parseInt(cpu_cores || "0"),
      memory_gb: parseInt(memory_gb || "0"),
      storage_gb: parseInt(storage_gb || "0"),
      bandwidth_mbps: parseInt(bandwidth_mbps || "0"),
      created_by: user.id
    });
    return c.json(createSuccessResponse({
      id: serverId,
      message: "服务器创建成功"
    }));
  } catch (error) {
    console.error("创建服务器失败:", error);
    return c.json(createErrorResponse(500, "创建服务器失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/servers/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const serverId = parseInt(c.req.param("id"));
    if (!serverId || isNaN(serverId)) {
      return c.json(createErrorResponse(400, "无效的服务器ID"), 400);
    }
    const body = await c.req.json();
    const {
      name,
      url,
      description,
      status,
      server_type,
      location,
      max_users,
      current_users,
      cpu_cores,
      memory_gb,
      storage_gb,
      bandwidth_mbps
    } = body;
    const db = new D1Database(c.env);
    const success = await db.updateServer(serverId, {
      name: name ? sanitizeInput(name) : void 0,
      url: url ? sanitizeInput(url) : void 0,
      description: description !== void 0 ? sanitizeInput(description) : void 0,
      status,
      server_type,
      location: location !== void 0 ? sanitizeInput(location) : void 0,
      max_users: max_users !== void 0 ? parseInt(max_users) : void 0,
      current_users: current_users !== void 0 ? parseInt(current_users) : void 0,
      cpu_cores: cpu_cores !== void 0 ? parseInt(cpu_cores) : void 0,
      memory_gb: memory_gb !== void 0 ? parseInt(memory_gb) : void 0,
      storage_gb: storage_gb !== void 0 ? parseInt(storage_gb) : void 0,
      bandwidth_mbps: bandwidth_mbps !== void 0 ? parseInt(bandwidth_mbps) : void 0
    });
    if (!success) {
      return c.json(createErrorResponse(404, "服务器不存在"), 404);
    }
    return c.json(createSuccessResponse({ message: "服务器更新成功" }));
  } catch (error) {
    console.error("更新服务器失败:", error);
    return c.json(createErrorResponse(500, "更新服务器失败", "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/admin/servers/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const serverId = parseInt(c.req.param("id"));
    if (!serverId || isNaN(serverId)) {
      return c.json(createErrorResponse(400, "无效的服务器ID"), 400);
    }
    const db = new D1Database(c.env);
    const success = await db.deleteServer(serverId);
    if (!success) {
      return c.json(createErrorResponse(404, "服务器不存在"), 404);
    }
    return c.json(createSuccessResponse({ message: "服务器删除成功" }));
  } catch (error) {
    console.error("删除服务器失败:", error);
    return c.json(createErrorResponse(500, "删除服务器失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/ai-apps/:id/posts", async (c) => {
  try {
    const aiAppId = parseInt(c.req.param("id"));
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    if (!aiAppId || isNaN(aiAppId)) {
      return c.json(createErrorResponse(400, "无效的AI应用ID"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.getCommunityPosts(aiAppId, page, limit);
    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || "操作失败"), 500);
    }
    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error("Get community posts error:", error);
    return c.json(createErrorResponse(500, "获取帖子列表失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/ai-apps/:id/posts", authMiddleware, async (c) => {
  try {
    const aiAppId = parseInt(c.req.param("id"));
    const user = c.get("user");
    const body = await c.req.json();
    const { content } = body;
    if (!aiAppId || isNaN(aiAppId)) {
      return c.json(createErrorResponse(400, "无效的AI应用ID"), 400);
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return c.json(createErrorResponse(400, "帖子内容不能为空"), 400);
    }
    if (content.trim().length > 1e3) {
      return c.json(createErrorResponse(400, "帖子内容不能超过1000字符"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.createCommunityPost(aiAppId, user.id, content.trim());
    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || "创建帖子失败"), 500);
    }
    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error("Create community post error:", error);
    return c.json(createErrorResponse(500, "创建帖子失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/community/posts/:id/like", authMiddleware, async (c) => {
  try {
    const postId = parseInt(c.req.param("id"));
    const user = c.get("user");
    if (!postId || isNaN(postId)) {
      return c.json(createErrorResponse(400, "无效的帖子ID"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.togglePostLike(postId, user.id);
    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || "操作失败"), 500);
    }
    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error("Toggle post like error:", error);
    return c.json(createErrorResponse(500, "操作失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/community/posts/:id/replies", async (c) => {
  try {
    const postId = parseInt(c.req.param("id"));
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    if (!postId || isNaN(postId)) {
      return c.json(createErrorResponse(400, "无效的帖子ID"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.getPostReplies(postId, page, limit);
    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || "获取回复列表失败"), 500);
    }
    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error("Get post replies error:", error);
    return c.json(createErrorResponse(500, "获取回复列表失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/community/posts/:id/replies", authMiddleware, async (c) => {
  try {
    const postId = parseInt(c.req.param("id"));
    const user = c.get("user");
    const body = await c.req.json();
    const { content } = body;
    if (!postId || isNaN(postId)) {
      return c.json(createErrorResponse(400, "无效的帖子ID"), 400);
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return c.json(createErrorResponse(400, "回复内容不能为空"), 400);
    }
    if (content.trim().length > 500) {
      return c.json(createErrorResponse(400, "回复内容不能超过500字符"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.createPostReply(postId, user.id, content.trim());
    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || "创建回复失败"), 500);
    }
    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error("Create post reply error:", error);
    return c.json(createErrorResponse(500, "创建回复失败", "server", "服务器内部错误"), 500);
  }
});
app.delete("/api/user/wechat-binding", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    await c.env.DB.prepare(`
      UPDATE users SET wechat_openid = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(user.id).run();
    return c.json(createSuccessResponse("微信账号解绑成功"));
  } catch (error) {
    console.error("微信解绑失败:", error);
    return c.json(createErrorResponse(500, "微信解绑失败"), 500);
  }
});
app.get("/api/wallet/balance", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json(createErrorResponse(401, "用户未认证"), 401);
    }
    const userBalance = await c.env.DB.prepare(`
      SELECT wh_coins FROM users WHERE id = ?
    `).bind(user.id).first();
    const whCoins = userBalance?.wh_coins || 0;
    return c.json(createSuccessResponse({
      wh_balance: whCoins,
      // 保持兼容性
      wh_coins: whCoins,
      membership_active: true
      // 可以根据实际会员状态逻辑调整
    }));
  } catch (error) {
    console.error("Get wallet balance error:", error);
    return c.json(createErrorResponse(500, "获取钱包余额失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/wallet/withdraw", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json(createErrorResponse(401, "用户未认证"), 401);
    }
    const { amount, wechat_account, payment_method = "wechat" } = await c.req.json();
    const withdrawAmount = parseFloat(amount);
    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return c.json(createErrorResponse(400, "提现金额必须大于0元"), 400);
    }
    if (payment_method !== "wechat") {
      return c.json(createErrorResponse(400, "目前仅支持微信提现"), 400);
    }
    if (!wechat_account || wechat_account.trim() === "") {
      return c.json(createErrorResponse(400, "请输入微信账号"), 400);
    }
    const userBalance = await c.env.DB.prepare(`
      SELECT balance FROM users WHERE id = ?
    `).bind(user.id).first();
    const currentBalance = userBalance?.balance || 0;
    if (currentBalance < withdrawAmount) {
      return c.json(createErrorResponse(400, "余额不足"), 400);
    }
    const withdrawalId = `WD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(`
      INSERT INTO withdrawals (id, user_id, amount, wechat_account, payment_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(withdrawalId, user.id, withdrawAmount, wechat_account, payment_method).run();
    await c.env.DB.prepare(`
      UPDATE users SET balance = balance - ? WHERE id = ?
    `).bind(withdrawAmount, user.id).run();
    await c.env.DB.prepare(`
      INSERT INTO transactions (user_id, type, transaction_type, amount, description, created_at)
      VALUES (?, 'withdrawal', 'withdrawal', ?, ?, datetime('now'))
    `).bind(
      user.id,
      -withdrawAmount,
      `提现申请 - ${withdrawalId}`
    ).run();
    return c.json(createSuccessResponse({
      withdrawal_id: withdrawalId,
      amount,
      status: "pending",
      message: "提现申请已提交，请等待审核"
    }));
  } catch (error) {
    console.error("Withdraw error:", error);
    return c.json(createErrorResponse(500, "提现申请失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/wallet/withdrawals", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json(createErrorResponse(401, "用户未认证"), 401);
    }
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = (page - 1) * limit;
    const withdrawals = await c.env.DB.prepare(`
      SELECT id, amount, wechat_account, status, created_at, processed_at
      FROM withdrawals
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();
    const total = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM withdrawals WHERE user_id = ?
    `).bind(user.id).first();
    return c.json(createSuccessResponse({
      withdrawals: withdrawals.results,
      pagination: {
        page,
        limit,
        total: total?.count || 0,
        pages: Math.ceil((total?.count || 0) / limit)
      }
    }));
  } catch (error) {
    console.error("Get withdrawals error:", error);
    return c.json(createErrorResponse(500, "获取提现记录失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/categories/:region", async (c) => {
  try {
    const region = c.req.param("region");
    if (!["global", "china", "usa"].includes(region)) {
      return c.json(createErrorResponse(400, "无效的地区参数"), 400);
    }
    const db = new D1Database(c.env);
    const categories = await db.getCategoriesByRegion(region);
    return c.json(createSuccessResponse(categories));
  } catch (error) {
    console.error("Get categories by region error:", error);
    return c.json(createErrorResponse(500, "获取分类列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/tags/:region", async (c) => {
  try {
    const region = c.req.param("region");
    const query = c.req.query();
    const categoryId = query.categoryId ? parseInt(query.categoryId) : void 0;
    if (!["global", "china", "usa"].includes(region)) {
      return c.json(createErrorResponse(400, "无效的地区参数"), 400);
    }
    const db = new D1Database(c.env);
    const tags = await db.getTagsByRegion(region, categoryId);
    return c.json(createSuccessResponse(tags));
  } catch (error) {
    console.error("Get tags by region error:", error);
    return c.json(createErrorResponse(500, "获取标签列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/countries", async (c) => {
  try {
    const db = new D1Database(c.env);
    const countries = await db.getCountries();
    return c.json(createSuccessResponse(countries));
  } catch (error) {
    console.error("Get countries error:", error);
    return c.json(createErrorResponse(500, "获取国家列表失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/category-requests", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { name, parent_id, region, description, reason } = body;
    if (!name || !region || !reason) {
      return c.json(createErrorResponse(400, "分类名称、地区和申请理由为必填项"), 400);
    }
    if (!["china", "usa"].includes(region)) {
      return c.json(createErrorResponse(400, "地区只能是china或usa"), 400);
    }
    const db = new D1Database(c.env);
    const request = await db.createCategoryRequest({
      user_id: user.id,
      name: sanitizeInput(name),
      parent_id: parent_id || void 0,
      region,
      description: description ? sanitizeInput(description) : void 0,
      reason: sanitizeInput(reason)
    });
    return c.json(createSuccessResponse(request));
  } catch (error) {
    console.error("Create category request error:", error);
    return c.json(createErrorResponse(500, "创建分类申请失败", "server", "服务器内部错误"), 500);
  }
});
app.post("/api/tag-requests", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { name, category_id, region, color, description, reason } = body;
    if (!name || !region || !reason) {
      return c.json(createErrorResponse(400, "标签名称、地区和申请理由为必填项"), 400);
    }
    if (!["china", "usa"].includes(region)) {
      return c.json(createErrorResponse(400, "地区只能是china或usa"), 400);
    }
    const db = new D1Database(c.env);
    const request = await db.createTagRequest({
      user_id: user.id,
      name: sanitizeInput(name),
      category_id: category_id || void 0,
      region,
      color: color || "#3B82F6",
      description: description ? sanitizeInput(description) : void 0,
      reason: sanitizeInput(reason)
    });
    return c.json(createSuccessResponse(request));
  } catch (error) {
    console.error("Create tag request error:", error);
    return c.json(createErrorResponse(500, "创建标签申请失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/category-requests", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(parseInt(query.pageSize || "20"), 100);
    const status = query.status;
    const region = query.region;
    const db = new D1Database(c.env);
    const result = await db.getCategoryRequests({
      page,
      pageSize,
      status,
      region
    });
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get category requests error:", error);
    return c.json(createErrorResponse(500, "获取分类申请列表失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/tag-requests", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(parseInt(query.pageSize || "20"), 100);
    const status = query.status;
    const region = query.region;
    const db = new D1Database(c.env);
    const result = await db.getTagRequests({
      page,
      pageSize,
      status,
      region
    });
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get tag requests error:", error);
    return c.json(createErrorResponse(500, "获取标签申请列表失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/category-requests/:id/review", authMiddleware, adminMiddleware, async (c) => {
  try {
    const requestId = parseInt(c.req.param("id"));
    const admin = c.get("user");
    const body = await c.req.json();
    const { status, admin_comment } = body;
    if (!requestId || isNaN(requestId)) {
      return c.json(createErrorResponse(400, "无效的申请ID"), 400);
    }
    if (!["approved", "rejected"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的审核状态"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.reviewCategoryRequest(requestId, admin.id, status, admin_comment);
    if (result.success) {
      return c.json(createSuccessResponse({ message: result.message }));
    } else {
      return c.json(createErrorResponse(400, result.message), 400);
    }
  } catch (error) {
    console.error("Review category request error:", error);
    return c.json(createErrorResponse(500, "审核分类申请失败", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/tag-requests/:id/review", authMiddleware, adminMiddleware, async (c) => {
  try {
    const requestId = parseInt(c.req.param("id"));
    const admin = c.get("user");
    const body = await c.req.json();
    const { status, admin_comment } = body;
    if (!requestId || isNaN(requestId)) {
      return c.json(createErrorResponse(400, "无效的申请ID"), 400);
    }
    if (!["approved", "rejected"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的审核状态"), 400);
    }
    const db = new D1Database(c.env);
    const result = await db.reviewTagRequest(requestId, admin.id, status, admin_comment);
    if (result.success) {
      return c.json(createSuccessResponse({ message: result.message }));
    } else {
      return c.json(createErrorResponse(400, result.message), 400);
    }
  } catch (error) {
    console.error("Review tag request error:", error);
    return c.json(createErrorResponse(500, "审核标签申请失败", "server", "服务器内部错误"), 500);
  }
});
app.get("/api/admin/tasks", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(parseInt(query.pageSize || "20"), 100);
    const offset = (page - 1) * pageSize;
    const search = query.search || "";
    const status = query.status || "";
    const sort_by = query.sort_by || "created_at";
    const order = query.order === "asc" ? "ASC" : "DESC";
    let whereConditions = ["1=1"];
    let params = [];
    if (search) {
      whereConditions.push("(t.title LIKE ? OR t.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      whereConditions.push("t.status = ?");
      params.push(status);
    }
    const whereClause = whereConditions.join(" AND ");
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}
    `).bind(...params).first();
    const total = countResult?.total || 0;
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) as submission_count,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id AND ts.status = 'pending') as pending_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE ${whereClause}
      ORDER BY ${sort_by} ${order}
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    const items = tasks.results?.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      reward_amount: row.reward_amount,
      end_date: row.end_date,
      status: row.status,
      submission_format: row.submission_format,
      category: row.category,
      created_by: row.created_by,
      creator_username: row.creator_username,
      created_at: row.created_at,
      updated_at: row.updated_at,
      submission_count: row.submission_count || 0,
      pending_count: row.pending_count || 0
    })) || [];
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error("Get admin tasks error:", error);
    return c.json(createErrorResponse(500, "获取任务列表失败"), 500);
  }
});
app.get("/api/admin/tasks/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        u.email as creator_email
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `).bind(taskId).first();
    if (!task) {
      return c.json(createErrorResponse(404, "任务不存在"), 404);
    }
    const { requirements, ...filteredTask } = task;
    return c.json(createSuccessResponse(filteredTask));
  } catch (error) {
    console.error("Get admin task detail error:", error);
    return c.json(createErrorResponse(500, "获取任务详情失败"), 500);
  }
});
app.post("/api/admin/tasks", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const body = await c.req.json();
    const {
      title: title2,
      description,
      reward,
      // 前端发送的字段名
      reward_amount,
      // 兼容直接使用数据库字段名的情况
      deadline,
      // 前端发送的字段名
      end_date,
      // 兼容直接使用数据库字段名的情况
      submission_types,
      status = "draft",
      category
    } = body;
    if (!title2 || !description) {
      return c.json(createErrorResponse(400, "标题和描述不能为空", "form", "请填写完整的任务信息"), 400);
    }
    const finalRewardAmount = reward_amount || reward;
    if (!finalRewardAmount || finalRewardAmount <= 0) {
      return c.json(createErrorResponse(400, "奖励金额必须大于0", "reward", "请设置有效的奖励金额"), 400);
    }
    const finalEndDate = end_date || deadline;
    if (!finalEndDate) {
      return c.json(createErrorResponse(400, "截止时间不能为空", "deadline", "请设置任务截止时间"), 400);
    }
    const endDateTime = new Date(finalEndDate);
    if (isNaN(endDateTime.getTime())) {
      return c.json(createErrorResponse(400, "截止时间格式无效", "deadline", "请使用有效的日期格式"), 400);
    }
    if (endDateTime <= /* @__PURE__ */ new Date()) {
      return c.json(createErrorResponse(400, "截止时间必须晚于当前时间", "deadline", "请设置未来的截止时间"), 400);
    }
    const startDate = (/* @__PURE__ */ new Date()).toISOString();
    const result = await c.env.DB.prepare(`
      INSERT INTO tasks (
        title, description, submission_types, reward_amount, reward_type,
        start_date, end_date, status, category, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      title2,
      description,
      submission_types || '["ai_app", "workflow"]',
      finalRewardAmount,
      "coins",
      // 默认奖励类型
      startDate,
      finalEndDate,
      status,
      category || null,
      admin.id
    ).run();
    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      message: "任务创建成功"
    }));
  } catch (error) {
    console.error("Create admin task error:", error);
    if (error instanceof Error) {
      if (error.message.includes("FOREIGN KEY constraint failed")) {
        return c.json(createErrorResponse(400, "创建者ID无效", "user", "用户信息异常，请重新登录"), 400);
      }
      if (error.message.includes("CHECK constraint failed")) {
        return c.json(createErrorResponse(400, "数据格式错误", "form", "请检查任务状态、优先级等字段的值"), 400);
      }
    }
    return c.json(createErrorResponse(500, "创建任务失败，请重试", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/tasks/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const body = await c.req.json();
    const {
      title: title2,
      description,
      reward_amount,
      reward,
      // 前端发送的字段名
      deadline,
      // 前端发送的字段名
      end_date,
      // 兼容直接使用数据库字段名的情况
      submission_types,
      status
    } = body;
    const finalRewardAmount = reward_amount || reward;
    const finalEndDate = end_date || deadline;
    await c.env.DB.prepare(`
      UPDATE tasks SET
        title = ?, description = ?, reward_amount = ?, end_date = ?,
        submission_types = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title2,
      description,
      finalRewardAmount,
      finalEndDate || null,
      submission_types || '["ai_app", "workflow"]',
      status || "draft",
      taskId
    ).run();
    return c.json(createSuccessResponse({ message: "任务更新成功" }));
  } catch (error) {
    console.error("Update admin task error:", error);
    return c.json(createErrorResponse(500, "更新任务失败"), 500);
  }
});
app.delete("/api/admin/tasks/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const task = await c.env.DB.prepare(`
      SELECT id, title FROM tasks WHERE id = ?
    `).bind(taskId).first();
    if (!task) {
      return c.json(createErrorResponse(404, "任务不存在"), 404);
    }
    const submissionCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM task_submissions WHERE task_id = ?
    `).bind(taskId).first();
    const count = submissionCount?.count || 0;
    if (count > 0) {
      return c.json(createErrorResponse(400, `该任务已有 ${count} 条提交记录，无法删除。请先处理所有提交记录后再删除任务。`, "validation", "任务删除失败"), 400);
    }
    const batch = [
      // 1. 删除任务领取记录
      c.env.DB.prepare("DELETE FROM task_claims WHERE task_id = ?").bind(taskId),
      // 2. 删除任务提交记录（虽然上面已经检查过，但为了保险起见）
      c.env.DB.prepare("DELETE FROM task_submissions WHERE task_id = ?").bind(taskId),
      // 3. 更新coze_workflows表中关联的task_id为NULL（如果有的话）
      c.env.DB.prepare("UPDATE coze_workflows SET task_id = NULL WHERE task_id = ?").bind(taskId),
      // 4. 最后删除任务本身
      c.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(taskId)
    ];
    const results = await c.env.DB.batch(batch);
    const taskDeleteResult = results[results.length - 1];
    if (taskDeleteResult.changes === 0) {
      return c.json(createErrorResponse(404, "任务不存在或已被删除"), 404);
    }
    const currentUser = c.get("user");
    try {
      const db = new D1Database(c.env);
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: "delete_task",
        target_type: "task",
        target_id: taskId,
        details: `删除任务: ${task.title}`
      });
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse({ message: "任务删除成功" }));
  } catch (error) {
    console.error("Delete admin task error:", error);
    return c.json(createErrorResponse(500, "删除任务失败，请稍后重试", "server", "服务器内部错误"), 500);
  }
});
app.put("/api/admin/tasks/:id/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, "无效的任务ID"), 400);
    }
    const body = await c.req.json();
    const { status } = body;
    if (!["draft", "published", "completed", "cancelled"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的状态值"), 400);
    }
    await c.env.DB.prepare(`
      UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, taskId).run();
    return c.json(createSuccessResponse({ message: "任务状态更新成功" }));
  } catch (error) {
    console.error("Update admin task status error:", error);
    return c.json(createErrorResponse(500, "更新任务状态失败"), 500);
  }
});
app.get("/api/admin/task-submissions", authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(parseInt(query.pageSize || "20"), 100);
    const offset = (page - 1) * pageSize;
    const search = query.search || "";
    const status = query.status || "";
    const task_id = query.task_id ? parseInt(query.task_id) : null;
    const sort_by = query.sort_by || "created_at";
    const order = query.order === "asc" ? "ASC" : "DESC";
    let whereConditions = ["1=1"];
    let params = [];
    if (search) {
      whereConditions.push("(t.title LIKE ? OR u.username LIKE ? OR ts.content LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      whereConditions.push("ts.status = ?");
      params.push(status);
    }
    if (task_id) {
      whereConditions.push("ts.task_id = ?");
      params.push(task_id);
    }
    const whereClause = whereConditions.join(" AND ");
    const taskCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN users u ON ts.user_id = u.id
      WHERE ${whereClause}
    `).bind(...params).first();
    const workflowCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM coze_workflows cw
      LEFT JOIN tasks t ON cw.task_id = t.id
      LEFT JOIN users u ON cw.creator_id = u.id
      WHERE cw.task_id IS NOT NULL ${task_id ? "AND cw.task_id = ?" : ""} ${search ? "AND (t.title LIKE ? OR u.username LIKE ? OR cw.title LIKE ?)" : ""} ${status ? "AND cw.status = ?" : ""}
    `).bind(...task_id ? [task_id] : [], ...search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [], ...status ? [status] : []).first();
    const taskTotal = taskCountResult?.total || 0;
    const workflowTotal = workflowCountResult?.total || 0;
    const total = taskTotal + workflowTotal;
    const taskSubmissions = await c.env.DB.prepare(`
      SELECT 
        ts.*,
        t.title as task_title,
        t.reward_amount,
        u.username,
        u.email as user_email,
        'task_submission' as submission_type
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN users u ON ts.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sort_by} ${order}
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    const workflowSubmissions = await c.env.DB.prepare(`
      SELECT 
        cw.id,
        cw.creator_id,
        cw.title,
        cw.description,
        cw.category_id,
        cw.subcategory_id,
        cw.price,
        cw.is_member_free,
        cw.download_price,
        cw.is_download_member_free,
        cw.workflow_file_url,
        cw.workflow_file_name,
        cw.workflow_file_size,
        cw.cover_image_url,
        cw.preview_video_url,
        cw.preview_images,
        cw.tags,
        cw.like_count,
        cw.favorite_count,
        cw.download_count,
        cw.view_count,
        cw.comment_count,
        cw.status,
        cw.is_featured,
        cw.is_official,
        cw.created_at,
        cw.updated_at,
        cw.coze_api,
        cw.task_id,
        cw.quick_commands,
        cw.type,
        t.title as task_title,
        t.reward_amount,
        u.username,
        u.email as user_email,
        cat.name as category_name,
        'workflow_submission' as submission_type
      FROM coze_workflows cw
      LEFT JOIN tasks t ON cw.task_id = t.id
      LEFT JOIN users u ON cw.creator_id = u.id
      LEFT JOIN categories cat ON cw.category_id = cat.id
      WHERE cw.task_id IS NOT NULL ${task_id ? "AND cw.task_id = ?" : ""} ${search ? "AND (t.title LIKE ? OR u.username LIKE ? OR cw.title LIKE ?)" : ""} ${status ? "AND cw.status = ?" : ""}
      ORDER BY cw.created_at ${order}
      LIMIT ? OFFSET ?
    `).bind(...task_id ? [task_id] : [], ...search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [], ...status ? [status] : [], pageSize, offset).all();
    const taskItems = taskSubmissions.results?.map((row) => ({
      id: row.id,
      task_id: row.task_id,
      task_title: row.task_title,
      user_id: row.user_id,
      username: row.username,
      user_email: row.user_email,
      content: row.submission_content,
      attachments: row.attachment_urls ? JSON.parse(row.attachment_urls) : [],
      status: row.status,
      admin_feedback: row.admin_feedback,
      reward_amount: row.reward_amount,
      created_at: row.created_at,
      updated_at: row.updated_at,
      submission_type: "task_submission"
    })) || [];
    const workflowItems = workflowSubmissions.results?.map((row) => ({
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      category_name: row.category_name,
      subcategory_id: row.subcategory_id,
      price: row.price,
      is_member_free: row.is_member_free,
      download_price: row.download_price,
      is_download_member_free: row.is_download_member_free,
      workflow_file_url: row.workflow_file_url,
      workflow_file_name: row.workflow_file_name,
      workflow_file_size: row.workflow_file_size,
      cover_image_url: row.cover_image_url,
      preview_video_url: row.preview_video_url,
      preview_images: row.preview_images,
      tags: row.tags,
      like_count: row.like_count,
      favorite_count: row.favorite_count,
      download_count: row.download_count,
      view_count: row.view_count,
      comment_count: row.comment_count,
      status: row.status,
      is_featured: row.is_featured,
      is_official: row.is_official,
      created_at: row.created_at,
      updated_at: row.updated_at,
      coze_api: row.coze_api,
      task_id: row.task_id,
      quick_commands: row.quick_commands,
      type: row.type,
      // 保持前端兼容性的字段映射
      task_title: row.task_title,
      user_id: row.creator_id,
      username: row.username,
      user_email: row.user_email,
      content: row.description,
      reward_amount: row.reward_amount,
      submission_type: "workflow_submission"
    })) || [];
    const items = [...taskItems, ...workflowItems].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return order === "DESC" ? dateB - dateA : dateA - dateB;
    });
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error("Get admin task submissions error:", error);
    return c.json(createErrorResponse(500, "获取任务提交列表失败"), 500);
  }
});
app.get("/api/admin/task-submissions/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const submissionId = parseInt(c.req.param("id"));
    const submissionType = c.req.query("type") || "task_submission";
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, "无效的提交ID"), 400);
    }
    let submission;
    if (submissionType === "workflow_submission") {
      submission = await c.env.DB.prepare(`
        SELECT 
          cw.*,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.requirements,
          t.submission_format,
          u.username,
          u.email as user_email
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        LEFT JOIN users u ON cw.creator_id = u.id
        WHERE cw.id = ?
      `).bind(submissionId).first();
    } else {
      submission = await c.env.DB.prepare(`
        SELECT 
          ts.*,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.requirements,
          t.submission_format,
          u.username,
          u.email as user_email
        FROM task_submissions ts
        LEFT JOIN tasks t ON ts.task_id = t.id
        LEFT JOIN users u ON ts.user_id = u.id
        WHERE ts.id = ?
      `).bind(submissionId).first();
    }
    if (!submission) {
      return c.json(createErrorResponse(404, "提交记录不存在"), 404);
    }
    let result;
    if (submissionType === "workflow_submission") {
      result = {
        ...submission,
        submission_type: "workflow_submission",
        user_id: submission.creator_id,
        content: submission.description
      };
    } else {
      result = {
        ...submission,
        submission_type: "task_submission",
        attachments: submission.attachment_urls ? JSON.parse(submission.attachment_urls) : []
      };
    }
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get admin task submission detail error:", error);
    return c.json(createErrorResponse(500, "获取提交详情失败"), 500);
  }
});
app.put("/api/admin/task-submissions/:id/review", authMiddleware, adminMiddleware, async (c) => {
  try {
    const submissionId = parseInt(c.req.param("id"));
    const submissionType = c.req.query("type") || "task_submission";
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, "无效的提交ID"), 400);
    }
    const admin = c.get("user");
    const body = await c.req.json();
    const { status, admin_feedback } = body;
    if (!["approved", "rejected"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的审核状态"), 400);
    }
    let submission;
    let userId;
    if (submissionType === "workflow_submission") {
      submission = await c.env.DB.prepare(`
        SELECT cw.*, t.reward_amount, t.title as task_title
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        WHERE cw.id = ?
      `).bind(submissionId).first();
      userId = submission?.creator_id;
    } else {
      submission = await c.env.DB.prepare(`
        SELECT ts.*, t.reward_amount, t.title as task_title
        FROM task_submissions ts
        LEFT JOIN tasks t ON ts.task_id = t.id
        WHERE ts.id = ?
      `).bind(submissionId).first();
      userId = submission?.user_id;
    }
    if (!submission) {
      return c.json(createErrorResponse(404, "提交记录不存在"), 404);
    }
    if (submission.status !== "pending") {
      return c.json(createErrorResponse(400, "该提交已被审核"), 400);
    }
    if (submissionType === "workflow_submission") {
      await c.env.DB.prepare(`
        UPDATE coze_workflows SET
          status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, admin_feedback || "", admin.id, submissionId).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE task_submissions SET
          status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, admin_feedback || "", admin.id, submissionId).run();
    }
    if (status === "approved" && submission.reward_amount > 0 && userId) {
      await c.env.DB.prepare(`
        UPDATE users SET 
          balance = balance + ?, 
          total_earnings = total_earnings + ?
        WHERE id = ?
      `).bind(
        submission.reward_amount,
        submission.reward_amount,
        userId
      ).run();
    }
    return c.json(createSuccessResponse({
      message: status === "approved" ? "审核通过，奖励已发放" : "审核完成"
    }));
  } catch (error) {
    console.error("Review task submission error:", error);
    return c.json(createErrorResponse(500, "审核提交失败"), 500);
  }
});
app.post("/api/admin/submissions/approve-with-rewards", authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { submission_id, workflow_id, user_id, reward_amount, comment } = body;
    if (!submission_id || !user_id) {
      return c.json(createErrorResponse(400, "缺少必要参数"), 400);
    }
    let submissionResult = await c.env.DB.prepare(`
      SELECT task_id FROM task_submissions WHERE id = ?
    `).bind(submission_id).first();
    let task_id = null;
    if (submissionResult) {
      task_id = submissionResult.task_id;
    } else {
      const workflowResult = await c.env.DB.prepare(`
        SELECT task_id FROM coze_workflows WHERE id = ?
      `).bind(submission_id).first();
      if (workflowResult && workflowResult.task_id) {
        task_id = workflowResult.task_id;
      } else {
        return c.json(createErrorResponse(404, "提交记录不存在"), 404);
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await c.env.DB.prepare(`
        UPDATE task_claims SET 
          updated_at = ?
        WHERE task_id = ? AND user_id = ?
      `).bind(now, task_id, user_id).run();
      await c.env.DB.prepare(`
        UPDATE tasks SET 
          status = 'completed',
          updated_at = ?
        WHERE id = ?
      `).bind(now, task_id).run();
      if (workflow_id) {
        await c.env.DB.prepare(`
          UPDATE coze_workflows SET 
            status = 'online', 
            updated_at = ?
          WHERE id = ?
        `).bind(now, workflow_id).run();
      }
      if (reward_amount > 0) {
        await c.env.DB.prepare(`
          UPDATE users SET 
            balance = balance + ?, 
            total_earnings = total_earnings + ?
          WHERE id = ?
        `).bind(reward_amount, reward_amount, user_id).run();
        await c.env.DB.prepare(`
          INSERT INTO transactions (
            user_id, workflow_id, type, transaction_type, amount, status, description, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user_id,
          null,
          // workflow_id设置为null，因为这是佣金交易，不关联workflows表
          "commission",
          "commission",
          // transaction_type字段也设置为commission
          reward_amount,
          "completed",
          comment || "任务审核通过，佣金奖励",
          now
        ).run();
      }
      const userResult = await c.env.DB.prepare(`
        SELECT balance FROM users WHERE id = ?
      `).bind(user_id).first();
      const newBalance = userResult?.balance || 0;
      return c.json(createSuccessResponse({
        success: true,
        message: "审核通过，奖励已发放",
        transaction_id: null,
        // 可以从上面的插入操作获取
        new_balance: newBalance
      }));
    } catch (dbError) {
      console.error("Database transaction error:", dbError);
      console.error("Error details:", {
        submission_id,
        workflow_id,
        user_id,
        reward_amount,
        task_id,
        error: dbError
      });
      return c.json(createErrorResponse(500, "数据库操作失败: " + dbError?.message || "Unknown error"), 500);
    }
  } catch (error) {
    console.error("Approve submission with rewards error:", error);
    return c.json(createErrorResponse(500, "审核处理失败"), 500);
  }
});
app.put("/api/admin/task-submissions/batch-review", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const body = await c.req.json();
    const { submission_ids, status, admin_feedback } = body;
    if (!Array.isArray(submission_ids) || submission_ids.length === 0) {
      return c.json(createErrorResponse(400, "请选择要审核的提交"), 400);
    }
    if (!["approved", "rejected"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的审核状态"), 400);
    }
    let successCount = 0;
    let errorCount = 0;
    for (const submissionId of submission_ids) {
      try {
        const submission = await c.env.DB.prepare(`
          SELECT ts.*, t.reward_amount
          FROM task_submissions ts
          LEFT JOIN tasks t ON ts.task_id = t.id
          WHERE ts.id = ? AND ts.status = 'pending'
        `).bind(submissionId).first();
        if (!submission) {
          errorCount++;
          continue;
        }
        await c.env.DB.prepare(`
          UPDATE task_submissions SET
            status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(status, admin_feedback || "", admin.id, submissionId).run();
        if (status === "approved" && submission.reward_amount > 0) {
          await c.env.DB.prepare(`
            UPDATE users SET 
              balance = balance + ?, 
              total_earnings = total_earnings + ?
            WHERE id = ?
          `).bind(
            submission.reward_amount,
            submission.reward_amount,
            submission.user_id
          ).run();
        }
        successCount++;
      } catch (error) {
        console.error(`批量审核提交 ${submissionId} 失败:`, error);
        errorCount++;
      }
    }
    return c.json(createSuccessResponse({
      message: `批量审核完成，成功 ${successCount} 个，失败 ${errorCount} 个`,
      success_count: successCount,
      error_count: errorCount
    }));
  } catch (error) {
    console.error("Batch review task submissions error:", error);
    return c.json(createErrorResponse(500, "批量审核失败"), 500);
  }
});
app.get("/api/admin/commission/records", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "20");
    const search = c.req.query("search") || "";
    const status = c.req.query("status");
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE 1=1";
    let params = [];
    if (search) {
      whereClause += " AND (u.username LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status && status !== "all") {
      whereClause += " AND cr.status = ?";
      params.push(status);
    }
    const recordsQuery = `
      SELECT 
        cr.id,
        cr.user_id,
        u.username,
        u.email,
        cr.admin_id,
        admin.username as admin_username,
        cr.total_wh_coins as total_rmb_amount,
        cr.days,
        cr.status,
        cr.created_at,
        cr.completed_at
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN users admin ON cr.admin_id = admin.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const records = await c.env.DB.prepare(recordsQuery).bind(...params, pageSize, offset).all();
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      ${whereClause}
    `;
    const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    return c.json(createSuccessResponse({
      items: records.results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error("Get commission records error:", error);
    return c.json(createErrorResponse(500, "获取佣金记录失败"), 500);
  }
});
app.get("/api/admin/commission/records/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const recordId = parseInt(c.req.param("id"));
    if (isNaN(recordId)) {
      return c.json(createErrorResponse(400, "无效的记录ID"), 400);
    }
    const recordQuery = `
      SELECT 
        cr.id,
        cr.user_id,
        u.username,
        u.email,
        cr.admin_id,
        admin.username as admin_username,
        cr.total_wh_coins as total_rmb_amount,
        cr.days,
        cr.status,
        cr.created_at,
        cr.completed_at
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN users admin ON cr.admin_id = admin.id
      WHERE cr.id = ?
    `;
    const record = await c.env.DB.prepare(recordQuery).bind(recordId).first();
    if (!record) {
      return c.json(createErrorResponse(404, "佣金记录不存在"), 404);
    }
    const dailyRecordsQuery = `
      SELECT 
        id,
        commission_record_id,
        day_number,
        wh_coins_amount as rmb_amount,
        reason,
        scheduled_date,
        actual_date,
        transaction_id,
        status
      FROM commission_daily_records
      WHERE commission_record_id = ?
      ORDER BY day_number ASC
    `;
    const dailyRecords = await c.env.DB.prepare(dailyRecordsQuery).bind(recordId).all();
    const result = {
      ...record,
      daily_records: dailyRecords.results
    };
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get commission record detail error:", error);
    return c.json(createErrorResponse(500, "获取佣金记录详情失败"), 500);
  }
});
app.get("/api/admin/commission/editable-records", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "20");
    const search = c.req.query("search") || "";
    const status = c.req.query("status");
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE cr.status IN ('pending', 'in_progress')";
    let params = [];
    if (search) {
      whereClause += " AND (u.username LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status && status !== "all" && status !== "editable") {
      whereClause += " AND cr.status = ?";
      params.push(status);
    }
    const recordsQuery = `
      SELECT 
        cr.id,
        cr.user_id,
        u.username,
        u.email,
        cr.admin_id,
        admin.username as admin_username,
        cr.total_wh_coins as total_rmb_amount,
        cr.days,
        cr.status,
        cr.created_at,
        cr.completed_at
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN users admin ON cr.admin_id = admin.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const records = await c.env.DB.prepare(recordsQuery).bind(...params, pageSize, offset).all();
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      ${whereClause}
    `;
    const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    return c.json(createSuccessResponse({
      items: records.results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error("Get editable commission records error:", error);
    return c.json(createErrorResponse(500, "获取可编辑佣金记录失败"), 500);
  }
});
app.put("/api/admin/commission/records/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const recordId = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { total_rmb_amount, days, daily_records } = body;
    const admin = c.get("user");
    if (isNaN(recordId)) {
      return c.json(createErrorResponse(400, "无效的记录ID"), 400);
    }
    const existingRecord = await c.env.DB.prepare(`
      SELECT * FROM commission_records 
      WHERE id = ? AND status IN ('pending', 'in_progress')
    `).bind(recordId).first();
    if (!existingRecord) {
      return c.json(createErrorResponse(404, "佣金记录不存在或不可编辑"), 404);
    }
    await c.env.DB.prepare(`
      UPDATE commission_records 
      SET total_wh_coins = ?, days = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(total_rmb_amount, days, recordId).run();
    if (daily_records && Array.isArray(daily_records)) {
      for (const dailyRecord of daily_records) {
        await c.env.DB.prepare(`
          UPDATE commission_daily_records 
          SET wh_coins_amount = ?, reason = ?, scheduled_date = ?
          WHERE id = ? AND commission_record_id = ? AND status = 'pending'
        `).bind(
          dailyRecord.rmb_amount,
          dailyRecord.reason,
          dailyRecord.scheduled_date,
          dailyRecord.id,
          recordId
        ).run();
      }
    }
    try {
      await c.env.DB.prepare(`
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES (?, 'update_commission_record', 'commission_record', ?, ?)
      `).bind(
        admin.id,
        recordId,
        `修改佣金记录: 总金额${total_rmb_amount}元，天数${days}天`
      ).run();
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse({ message: "佣金记录更新成功" }));
  } catch (error) {
    console.error("Update commission record error:", error);
    return c.json(createErrorResponse(500, "更新佣金记录失败"), 500);
  }
});
app.put("/api/admin/commission/records/:id/cancel", authMiddleware, adminMiddleware, async (c) => {
  try {
    const recordId = parseInt(c.req.param("id"));
    const admin = c.get("user");
    if (isNaN(recordId)) {
      return c.json(createErrorResponse(400, "无效的记录ID"), 400);
    }
    const existingRecord = await c.env.DB.prepare(`
      SELECT * FROM commission_records 
      WHERE id = ? AND status IN ('pending', 'in_progress')
    `).bind(recordId).first();
    if (!existingRecord) {
      return c.json(createErrorResponse(404, "佣金记录不存在或不可取消"), 404);
    }
    await c.env.DB.prepare(`
      UPDATE commission_records 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(recordId).run();
    await c.env.DB.prepare(`
      UPDATE commission_daily_records 
      SET status = 'cancelled'
      WHERE commission_record_id = ? AND status = 'pending'
    `).bind(recordId).run();
    try {
      await c.env.DB.prepare(`
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES (?, 'cancel_commission_record', 'commission_record', ?, ?)
      `).bind(
        admin.id,
        recordId,
        `取消佣金记录: 总金额${existingRecord.total_wh_coins}元`
      ).run();
    } catch (logError) {
      console.error("Failed to add admin log:", logError);
    }
    return c.json(createSuccessResponse({ message: "佣金记录已取消" }));
  } catch (error) {
    console.error("Cancel commission record error:", error);
    return c.json(createErrorResponse(500, "取消佣金记录失败"), 500);
  }
});
app.get("/api/admin/commission/users", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const search = c.req.query("search") || "";
    const role = c.req.query("role") || "creator";
    const offset = (page - 1) * pageSize;
    let whereClause = "WHERE u.role = ?";
    let params = [role];
    if (search) {
      whereClause += " AND (u.username LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.status,
        u.total_earnings,
        u.created_at,
        'pending' as earnings_status,
        0 as workflow_count,
        0 as ai_app_count
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const users = await c.env.DB.prepare(usersQuery).bind(...params, pageSize, offset).all();
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const totalResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    return c.json(createSuccessResponse({
      items: users.results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error("Get commission users error:", error);
    return c.json(createErrorResponse(500, "获取佣金用户列表失败"), 500);
  }
});
app.get("/api/admin/commission/stats", authMiddleware, adminMiddleware, async (c) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'creator' AND status = 'active') as total_creators,
        0 as total_workflows
    `;
    const stats = await c.env.DB.prepare(statsQuery).first();
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    console.error("Get commission stats error:", error);
    return c.json(createErrorResponse(500, "获取佣金统计失败"), 500);
  }
});
app.get("/api/admin/initial-commission/plans", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const status = c.req.query("status");
    const db = new D1Database(c.env);
    const result = await db.getInitialCommissionPlans({ page, pageSize, status });
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get initial commission plans error:", error);
    return c.json(createErrorResponse(500, "获取佣金计划列表失败"), 500);
  }
});
app.post("/api/admin/initial-commission/plans", authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const {
      name,
      description,
      trigger_type,
      amount_type,
      amount_value,
      max_amount,
      valid_days,
      max_uses_per_user,
      total_budget,
      status,
      workflow_threshold,
      auto_trigger
    } = body;
    if (!name || !trigger_type || !amount_type || amount_value === void 0) {
      return c.json(createErrorResponse(400, "缺少必填字段"), 400);
    }
    const db = new D1Database(c.env);
    const plan = await db.createInitialCommissionPlan({
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : void 0,
      trigger_type,
      amount_type,
      amount_value: parseFloat(amount_value),
      max_amount: max_amount ? parseFloat(max_amount) : void 0,
      valid_days: valid_days ? parseInt(valid_days) : void 0,
      max_uses_per_user: max_uses_per_user ? parseInt(max_uses_per_user) : void 0,
      total_budget: total_budget ? parseFloat(total_budget) : void 0,
      status: status || "active",
      workflow_threshold: workflow_threshold ? parseInt(workflow_threshold) : void 0,
      auto_trigger: auto_trigger || false,
      created_by: user.id
    });
    return c.json(createSuccessResponse(plan));
  } catch (error) {
    console.error("Create initial commission plan error:", error);
    return c.json(createErrorResponse(500, "创建佣金计划失败"), 500);
  }
});
app.put("/api/admin/initial-commission/plans/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const planId = parseInt(c.req.param("id"));
    const body = await c.req.json();
    if (isNaN(planId)) {
      return c.json(createErrorResponse(400, "无效的计划ID"), 400);
    }
    const updates = { updated_by: user.id };
    if (body.name !== void 0) updates.name = sanitizeInput(body.name);
    if (body.description !== void 0) updates.description = sanitizeInput(body.description);
    if (body.fixed_amount !== void 0) updates.fixed_amount = parseFloat(body.fixed_amount);
    if (body.amount_value !== void 0) updates.fixed_amount = parseFloat(body.amount_value);
    if (body.payout_cycle !== void 0) updates.payout_cycle = parseInt(body.payout_cycle);
    if (body.trigger_type !== void 0) updates.trigger_type = body.trigger_type;
    if (body.workflow_threshold !== void 0) updates.workflow_threshold = parseInt(body.workflow_threshold);
    if (body.auto_trigger !== void 0) updates.auto_trigger = body.auto_trigger;
    if (body.target_user_type !== void 0) updates.target_user_type = body.target_user_type;
    if (body.status !== void 0) {
      updates.is_active = body.status === "active";
    }
    const db = new D1Database(c.env);
    const plan = await db.updateInitialCommissionPlan(planId, updates);
    return c.json(createSuccessResponse(plan));
  } catch (error) {
    console.error("Update initial commission plan error:", error);
    return c.json(createErrorResponse(500, "更新佣金计划失败"), 500);
  }
});
app.get("/api/admin/initial-commission/plans/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const planId = parseInt(c.req.param("id"));
    if (isNaN(planId)) {
      return c.json(createErrorResponse(400, "无效的计划ID"), 400);
    }
    const db = new D1Database(c.env);
    const plan = await db.getInitialCommissionPlan(planId);
    if (plan) {
      return c.json(createSuccessResponse(plan));
    } else {
      return c.json(createErrorResponse(404, "计划不存在"), 404);
    }
  } catch (error) {
    console.error("Get initial commission plan error:", error);
    return c.json(createErrorResponse(500, "获取佣金计划失败"), 500);
  }
});
app.delete("/api/admin/initial-commission/plans/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const planId = parseInt(c.req.param("id"));
    if (isNaN(planId)) {
      return c.json(createErrorResponse(400, "无效的计划ID"), 400);
    }
    const db = new D1Database(c.env);
    const success = await db.deleteInitialCommissionPlan(planId, user.id);
    if (success) {
      return c.json(createSuccessResponse({ message: "删除成功" }));
    } else {
      return c.json(createErrorResponse(404, "计划不存在或删除失败"), 404);
    }
  } catch (error) {
    console.error("Delete initial commission plan error:", error);
    return c.json(createErrorResponse(500, "删除佣金计划失败"), 500);
  }
});
app.get("/api/admin/initial-commission/users", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const search = c.req.query("search");
    const status = c.req.query("status");
    const planId = c.req.query("planId") ? parseInt(c.req.query("planId")) : void 0;
    const db = new D1Database(c.env);
    const result = await db.getUserInitialCommissionConfigs({
      page,
      pageSize,
      search,
      status,
      planId
    });
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get user commission configs error:", error);
    return c.json(createErrorResponse(500, "获取用户佣金配置失败"), 500);
  }
});
app.get("/api/admin/initial-commission/users-with-payouts", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const search = c.req.query("search");
    const status = c.req.query("status");
    const planId = c.req.query("planId") ? parseInt(c.req.query("planId")) : void 0;
    const db = new D1Database(c.env);
    const result = await db.getUserInitialCommissionWithPayouts({
      page,
      pageSize,
      search,
      status,
      planId
    });
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Get user commission configs with payouts error:", error);
    return c.json(createErrorResponse(500, "获取用户佣金配置及发放进度失败"), 500);
  }
});
app.put("/api/admin/initial-commission/users/:userId/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const userId = parseInt(c.req.param("userId"));
    const body = await c.req.json();
    const { is_active } = body;
    if (isNaN(userId)) {
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    let isActiveBoolean;
    if (typeof is_active === "number") {
      if (is_active === 0) {
        isActiveBoolean = false;
      } else if (is_active === 1) {
        isActiveBoolean = true;
      } else {
        return c.json(createErrorResponse(400, "无效的is_active值，必须是0或1"), 400);
      }
    } else if (typeof is_active === "boolean") {
      isActiveBoolean = is_active;
    } else {
      return c.json(createErrorResponse(400, "无效的is_active值，必须是数字（0或1）或布尔类型"), 400);
    }
    const db = new D1Database(c.env);
    const success = await db.updateUserCommissionStatus(userId, isActiveBoolean, admin.id);
    if (success) {
      const userConfig = await c.env.DB.prepare(
        "SELECT is_active FROM user_initial_commission_configs WHERE user_id = ?"
      ).bind(userId).first();
      if (userConfig) {
        return c.json(createSuccessResponse({
          message: "更新成功",
          user: {
            id: userId,
            is_active: userConfig.is_active
          }
        }));
      } else {
        return c.json(createErrorResponse(404, "用户佣金配置不存在"), 404);
      }
    } else {
      return c.json(createErrorResponse(500, "更新失败"), 500);
    }
  } catch (error) {
    console.error("Update user commission status error:", error);
    return c.json(createErrorResponse(500, "更新用户佣金状态失败"), 500);
  }
});
app.get("/api/admin/initial-commission/users/:userId/eligible-plans", authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param("userId"));
    if (isNaN(userId)) {
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    const db = new D1Database(c.env);
    const eligiblePlans = await db.getEligibleCommissionPlansForUser(userId);
    return c.json(createSuccessResponse(eligiblePlans));
  } catch (error) {
    console.error("Get eligible commission plans error:", error);
    return c.json(createErrorResponse(500, "获取用户符合条件的计划失败"), 500);
  }
});
app.get("/api/admin/initial-commission/stats", authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = new D1Database(c.env);
    const stats = await db.getCommissionStats();
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    console.error("Get initial commission stats error:", error);
    return c.json(createErrorResponse(500, "获取佣金统计数据失败"), 500);
  }
});
app.post("/api/admin/initial-commission/plans/:planId/assign", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const planId = parseInt(c.req.param("planId"));
    const body = await c.req.json();
    const { userId } = body;
    if (isNaN(planId) || isNaN(userId)) {
      return c.json(createErrorResponse(400, "无效的计划ID或用户ID"), 400);
    }
    const db = new D1Database(c.env);
    const success = await db.assignCommissionPlanToUser(planId, userId, admin.id);
    if (success) {
      return c.json(createSuccessResponse({ message: "分配成功" }));
    } else {
      return c.json(createErrorResponse(400, "用户已分配该计划或分配失败"), 400);
    }
  } catch (error) {
    console.error("Assign commission plan error:", error);
    return c.json(createErrorResponse(500, "分配佣金计划失败"), 500);
  }
});
app.delete("/api/admin/initial-commission/plans/:planId/users/:userId", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const planId = parseInt(c.req.param("planId"));
    const userId = parseInt(c.req.param("userId"));
    if (isNaN(planId) || isNaN(userId)) {
      return c.json(createErrorResponse(400, "无效的计划ID或用户ID"), 400);
    }
    const db = new D1Database(c.env);
    const success = await db.removeCommissionPlanFromUser(planId, userId, admin.id);
    if (success) {
      return c.json(createSuccessResponse({ message: "移除成功" }));
    } else {
      return c.json(createErrorResponse(404, "分配关系不存在或移除失败"), 404);
    }
  } catch (error) {
    console.error("Remove commission plan error:", error);
    return c.json(createErrorResponse(500, "移除佣金计划失败"), 500);
  }
});
app.get("/api/admin/initial-commission/payouts", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const userId = c.req.query("userId") ? parseInt(c.req.query("userId")) : void 0;
    const status = c.req.query("status");
    const payoutType = c.req.query("payoutType");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const offset = (page - 1) * pageSize;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    if (userId) {
      whereConditions.push(`p.user_id = ?${paramIndex++}`);
      params.push(userId);
    }
    if (status) {
      whereConditions.push(`p.status = ?${paramIndex++}`);
      params.push(status);
    }
    if (payoutType) {
      whereConditions.push(`p.payout_type = ?${paramIndex++}`);
      params.push(payoutType);
    }
    if (startDate) {
      whereConditions.push(`DATE(p.created_at) >= ?${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push(`DATE(p.created_at) <= ?${paramIndex++}`);
      params.push(endDate);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const countQuery = `
      SELECT COUNT(*) as total
      FROM initial_commission_payouts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const dataQuery = `
      SELECT 
        p.*,
        u.username,
        u.email,
        plan.name as plan_name,
        config.fixed_amount as config_amount,
        config.payout_cycle
      FROM initial_commission_payouts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN initial_commission_plans plan ON p.plan_id = plan.id
      LEFT JOIN user_initial_commission_configs config ON p.config_id = config.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ?${paramIndex++} OFFSET ?${paramIndex++}
    `;
    params.push(pageSize, offset);
    const payouts = await c.env.DB.prepare(dataQuery).bind(...params).all();
    return c.json(createSuccessResponse({
      items: payouts.results || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }));
  } catch (error) {
    console.error("Get initial commission payouts error:", error);
    return c.json(createErrorResponse(500, "获取佣金发放记录失败"), 500);
  }
});
app.post("/api/admin/initial-commission/manual-payout", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const body = await c.req.json();
    const { userId, amount, reason } = body;
    if (!userId || !amount || amount <= 0) {
      return c.json(createErrorResponse(400, "无效的用户ID或金额"), 400);
    }
    const configQuery = `
      SELECT * FROM user_initial_commission_configs 
      WHERE user_id = ?1 AND is_active = TRUE
    `;
    const config2 = await c.env.DB.prepare(configQuery).bind(userId).first();
    if (!config2) {
      return c.json(createErrorResponse(404, "用户佣金配置不存在或未激活"), 404);
    }
    const payoutQuery = `
      INSERT INTO initial_commission_payouts (
        user_id, config_id, plan_id, amount, payout_type, 
        trigger_reason, scheduled_date, status, created_at, updated_at, processed_by
      ) VALUES (?1, ?2, ?3, ?4, 'manual', ?5, DATE('now'), 'pending', DATETIME('now'), DATETIME('now'), ?6)
    `;
    const result = await c.env.DB.prepare(payoutQuery).bind(
      userId,
      config2.id,
      config2.plan_id,
      amount,
      reason || "管理员手动发放",
      admin.id
    ).run();
    if (result.success) {
      const logQuery = `
        INSERT INTO initial_commission_operation_logs (
          operation_type, target_type, target_id, user_id, operator_id,
          operation_data, description, created_at
        ) VALUES (
          'manual_payout', 'payout', ?1, ?2, ?3, ?4, ?5, DATETIME('now')
        )
      `;
      await c.env.DB.prepare(logQuery).bind(
        result.meta.last_row_id,
        userId,
        admin.id,
        JSON.stringify({ amount, reason }),
        `管理员手动发放佣金: ${amount}元`
      ).run();
      return c.json(createSuccessResponse({
        id: result.meta.last_row_id,
        message: "佣金发放记录创建成功"
      }));
    } else {
      return c.json(createErrorResponse(500, "创建发放记录失败"), 500);
    }
  } catch (error) {
    console.error("Manual payout error:", error);
    return c.json(createErrorResponse(500, "手动发放佣金失败"), 500);
  }
});
app.post("/api/admin/initial-commission/batch-payout", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const body = await c.req.json();
    const { userIds, amount, reason } = body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !amount || amount <= 0) {
      return c.json(createErrorResponse(400, "无效的用户列表或金额"), 400);
    }
    const results = [];
    const errors = [];
    for (const userId of userIds) {
      try {
        const configQuery = `
          SELECT * FROM user_initial_commission_configs 
          WHERE user_id = ?1 AND is_active = TRUE
        `;
        const config2 = await c.env.DB.prepare(configQuery).bind(userId).first();
        if (!config2) {
          errors.push({ userId, error: "用户佣金配置不存在或未激活" });
          continue;
        }
        const payoutQuery = `
          INSERT INTO initial_commission_payouts (
            user_id, config_id, plan_id, amount, payout_type, 
            trigger_reason, scheduled_date, status, created_at, updated_at, processed_by
          ) VALUES (?1, ?2, ?3, ?4, 'manual', ?5, DATE('now'), 'pending', DATETIME('now', '+8 hours'), DATETIME('now', '+8 hours'), ?6)
        `;
        const result = await c.env.DB.prepare(payoutQuery).bind(
          userId,
          config2.id,
          config2.plan_id,
          amount,
          reason || "管理员批量发放",
          admin.id
        ).run();
        if (result.success) {
          results.push({ userId, payoutId: result.meta.last_row_id });
          const logQuery = `
            INSERT INTO initial_commission_operation_logs (
              operation_type, target_type, target_id, user_id, operator_id,
              operation_data, description, created_at
            ) VALUES (
              'batch_payout', 'payout', ?1, ?2, ?3, ?4, ?5, DATETIME('now')
            )
          `;
          await c.env.DB.prepare(logQuery).bind(
            result.meta.last_row_id,
            userId,
            admin.id,
            JSON.stringify({ amount, reason }),
            `管理员批量发放佣金: ${amount}元`
          ).run();
        } else {
          errors.push({ userId, error: "创建发放记录失败" });
        }
      } catch (error) {
        errors.push({ userId, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return c.json(createSuccessResponse({
      success: results,
      errors,
      message: `批量发放完成，成功: ${results.length}，失败: ${errors.length}`
    }));
  } catch (error) {
    console.error("Batch payout error:", error);
    return c.json(createErrorResponse(500, "批量发放佣金失败"), 500);
  }
});
app.put("/api/admin/initial-commission/payouts/:id/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get("user");
    const payoutId = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { status, failureReason, transactionId } = body;
    if (isNaN(payoutId)) {
      return c.json(createErrorResponse(400, "无效的发放记录ID"), 400);
    }
    if (!status || !["pending", "processing", "completed", "failed", "cancelled"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的状态值"), 400);
    }
    let updateFields = ["status = ?1", "updated_at = DATETIME('now')"];
    let params = [status];
    let paramIndex = 2;
    if (status === "completed") {
      updateFields.push(`actual_payout_date = DATE('now')`);
      if (transactionId) {
        updateFields.push(`transaction_id = ?${paramIndex++}`);
        params.push(transactionId);
      }
    }
    if (status === "failed" && failureReason) {
      updateFields.push(`failure_reason = ?${paramIndex++}`);
      params.push(failureReason);
    }
    const updateQuery = `
      UPDATE initial_commission_payouts 
      SET ${updateFields.join(", ")}
      WHERE id = ?${paramIndex++}
    `;
    params.push(payoutId);
    const result = await c.env.DB.prepare(updateQuery).bind(...params).run();
    if (result.success && result.changes > 0) {
      const logQuery = `
        INSERT INTO initial_commission_operation_logs (
          operation_type, target_type, target_id, operator_id,
          operation_data, description, created_at
        ) VALUES (
          'update_payout_status', 'payout', ?1, ?2, ?3, ?4, DATETIME('now')
        )
      `;
      await c.env.DB.prepare(logQuery).bind(
        payoutId,
        admin.id,
        JSON.stringify({ status, failureReason, transactionId }),
        `更新发放记录状态: ${status}`
      ).run();
      return c.json(createSuccessResponse({ message: "状态更新成功" }));
    } else {
      return c.json(createErrorResponse(404, "发放记录不存在或更新失败"), 404);
    }
  } catch (error) {
    console.error("Update payout status error:", error);
    return c.json(createErrorResponse(500, "更新发放记录状态失败"), 500);
  }
});
app.get("/api/creator/earnings-history", authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "20");
    const offset = (page - 1) * pageSize;
    const earningsQuery = `
      SELECT 
        cdr.id,
        cdr.commission_record_id,
        cdr.day_number,
        cdr.wh_coins_amount as rmb_amount,
        cdr.reason,
        cdr.scheduled_date,
        cdr.actual_date,
        cdr.transaction_id,
        cdr.status,
        cdr.created_at,
        cdr.completed_at,
        cr.total_wh_coins as total_commission
      FROM commission_daily_records cdr
      JOIN commission_records cr ON cdr.commission_record_id = cr.id
      WHERE cr.user_id = ? AND cdr.status = 'completed'
      ORDER BY cdr.actual_date DESC, cdr.day_number ASC
      LIMIT ? OFFSET ?
    `;
    const earnings = await c.env.DB.prepare(earningsQuery).bind(user.id, pageSize, offset).all();
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_daily_records cdr
      JOIN commission_records cr ON cdr.commission_record_id = cr.id
      WHERE cr.user_id = ? AND cdr.status = 'completed'
    `;
    const totalResult = await c.env.DB.prepare(countQuery).bind(user.id).first();
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    const formattedEarnings = (earnings.results || []).map((record) => ({
      ...record,
      rmb_amount: parseFloat(record.rmb_amount || 0).toFixed(2)
    }));
    return c.json(createSuccessResponse({
      items: formattedEarnings,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error("Get creator earnings history error:", error);
    return c.json(createErrorResponse(500, "获取收益记录失败"), 500);
  }
});
app.get("/api/admin/creators/:id/detail", authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param("id"));
    if (isNaN(userId)) {
      return c.json(createErrorResponse(400, "无效的用户ID"), 400);
    }
    let workflows = { results: [] };
    const processedWorkflows = workflows.results?.map((w) => ({
      ...w,
      cover_image_url: w.preview_images ? JSON.parse(w.preview_images)[0] : null
    })) || [];
    return c.json(createSuccessResponse({
      workflows: processedWorkflows
      // ai_apps removed as ai_apps table no longer exists
    }));
  } catch (error) {
    console.error("Get creator detail error:", error);
    return c.json(createErrorResponse(500, "获取创作者详情失败"), 500);
  }
});
app.post("/api/admin/commission/issue-by-days", authMiddleware, adminMiddleware, async (c) => {
  const admin = c.get("user");
  let user_id, total_wh_coins, days;
  try {
    const body = await c.req.json();
    ({ user_id, total_wh_coins, days } = body);
    if (!user_id || !total_wh_coins || !days) {
      return c.json(createErrorResponse(400, "缺少必要参数"), 400);
    }
    if (total_wh_coins <= 0 || days <= 0) {
      return c.json(createErrorResponse(400, "佣金金额和天数必须大于0"), 400);
    }
    const user = await c.env.DB.prepare(`
      SELECT id, username, role FROM users WHERE id = ? AND role = 'creator'
    `).bind(user_id).first();
    if (!user) {
      return c.json(createErrorResponse(404, "用户不存在或不是创作者"), 404);
    }
    const worksQuery = `
      SELECT 
        0 as workflow_count,
        0 as total_downloads
    `;
    const worksStats = await c.env.DB.prepare(worksQuery).first();
    const commissionResult = await c.env.DB.prepare(`
      INSERT INTO commission_records (user_id, admin_id, total_wh_coins, days, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(user_id, admin.id, total_wh_coins, days).run();
    const commissionRecordId = commissionResult.meta.last_row_id;
    const dailySchedule = [];
    let remainingAmount = total_wh_coins;
    const today = /* @__PURE__ */ new Date();
    const dailyAmounts = [];
    const phase1Days = Math.ceil(days * 0.33);
    const phase2Days = Math.ceil(days * 0.17);
    const phase3Days = days - phase1Days - phase2Days;
    const phase1Ratio = 0.3;
    const phase2Ratio = 0.4;
    const phase3Ratio = 0.3;
    const phase1Total = total_wh_coins * phase1Ratio;
    const phase2Total = total_wh_coins * phase2Ratio;
    const phase3Total = total_wh_coins * phase3Ratio;
    for (let i = 0; i < phase1Days; i++) {
      const progress = (i + 1) / phase1Days;
      const baseAmount = phase1Total / phase1Days;
      const increment = baseAmount * progress * 0.5;
      dailyAmounts.push(Math.max(0.01, Math.round((baseAmount + increment) * 100) / 100));
    }
    for (let i = 0; i < phase2Days; i++) {
      const progress = 1 - i / phase2Days;
      const baseAmount = phase2Total / phase2Days;
      const decrement = baseAmount * progress * 0.3;
      dailyAmounts.push(Math.max(0.01, Math.round((baseAmount + decrement) * 100) / 100));
    }
    for (let i = 0; i < phase3Days; i++) {
      const baseAmount = phase3Total / phase3Days;
      const randomFactor = 0.5 + Math.random() * 0.5;
      dailyAmounts.push(Math.max(0.01, Math.round(baseAmount * randomFactor * 100) / 100));
    }
    const currentTotal = dailyAmounts.reduce((sum, amount) => sum + amount, 0);
    const difference = total_wh_coins - currentTotal;
    if (Math.abs(difference) > 0.01) {
      dailyAmounts[dailyAmounts.length - 1] = Math.max(0.01, Math.round((dailyAmounts[dailyAmounts.length - 1] + difference) * 100) / 100);
    }
    for (let day = 1; day <= days; day++) {
      const dailyAmount = dailyAmounts[day - 1];
      remainingAmount -= dailyAmount;
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + day - 1);
      let reason = "";
      const totalWorks = (worksStats?.workflow_count || 0) + (worksStats?.ai_app_count || 0);
      if (totalWorks > 30) {
        reason = "优秀创作者奖励，请继续创作精彩内容！";
      } else if (totalWorks < 10) {
        reason = "创作激励奖金，希望能激发您更多创意！";
      } else {
        reason = "您的创作才华值得鼓励，期待更多优秀作品！";
      }
      const status = day === 1 ? "completed" : "pending";
      const actualDate = day === 1 ? scheduledDate.toISOString().split("T")[0] : null;
      await c.env.DB.prepare(`
        INSERT INTO commission_daily_records 
        (commission_record_id, day_number, wh_coins_amount, reason, scheduled_date, actual_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        commissionRecordId,
        day,
        dailyAmount,
        reason,
        scheduledDate.toISOString().split("T")[0],
        actualDate,
        status
      ).run();
      if (day === 1) {
        await c.env.DB.prepare(`
          UPDATE users SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?
        `).bind(dailyAmount, dailyAmount, user_id).run();
      }
      dailySchedule.push({
        day,
        amount: dailyAmount,
        scheduled_date: scheduledDate.toISOString().split("T")[0],
        status
      });
    }
    await c.env.DB.prepare(`
      UPDATE commission_records SET status = 'in_progress' WHERE id = ?
    `).bind(commissionRecordId).run();
    return c.json(createSuccessResponse({
      success: true,
      message: `成功创建${days}天的佣金发放计划，总计${total_wh_coins}元`,
      commission_record_id: commissionRecordId,
      daily_schedule: dailySchedule
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : void 0;
    console.error("创建佣金发放计划失败 - 详细错误信息:", {
      error: errorMessage,
      stack: errorStack,
      user_id,
      total_wh_coins,
      days,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return c.json(createErrorResponse(500, `创建佣金发放计划失败: ${errorMessage}`), 500);
  }
});
app.get("/api/admin/withdrawal-requests", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const status = c.req.query("status");
    const user_id = c.req.query("user_id");
    const min_amount = c.req.query("min_amount");
    const max_amount = c.req.query("max_amount");
    const offset = (page - 1) * pageSize;
    let whereConditions = [];
    let params = [];
    if (status && status !== "all") {
      whereConditions.push("w.status = ?");
      params.push(status);
    }
    if (user_id) {
      whereConditions.push("w.user_id = ?");
      params.push(parseInt(user_id));
    }
    if (min_amount) {
      whereConditions.push("w.amount >= ?");
      params.push(parseFloat(min_amount));
    }
    if (max_amount) {
      whereConditions.push("w.amount <= ?");
      params.push(parseFloat(max_amount));
    }
    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";
    const query = `
      SELECT 
        w.*,
        u.username,
        u.email,
        u.role,
        u.total_earnings,
        u.wh_coins,
        u.status as user_status
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const result = await c.env.DB.prepare(query).bind(...params, pageSize, offset).all();
    const countQuery = `
      SELECT COUNT(*) as total
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
    `;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    const withdrawalRequests = (result.results || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        role: row.role,
        total_earnings: row.total_earnings,
        wh_coins: row.wh_coins,
        status: row.user_status,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      amount: row.amount,
      wechat_account: row.wechat_account,
      payment_method: row.payment_method,
      status: row.status,
      batch_id: row.batch_id,
      transfer_id: row.transfer_id,
      failure_reason: row.failure_reason,
      processed_at: row.processed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reviewed_at: row.processed_at,
      admin_comment: row.failure_reason
    }));
    return c.json(createSuccessResponse({
      items: withdrawalRequests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error("获取提现请求失败:", error);
    return c.json(createErrorResponse(500, "获取提现请求失败"), 500);
  }
});
app.put("/api/admin/withdrawal-requests/:id/review", authMiddleware, adminMiddleware, async (c) => {
  try {
    const withdrawalId = c.req.param("id");
    const { status, admin_comment } = await c.req.json();
    if (!status || !["approved", "rejected"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的审核状态"), 400);
    }
    if (status === "rejected" && !admin_comment) {
      return c.json(createErrorResponse(400, "拒绝提现时必须填写审核意见"), 400);
    }
    const withdrawal = await c.env.DB.prepare(`
      SELECT * FROM withdrawals WHERE id = ?
    `).bind(withdrawalId).first();
    if (!withdrawal) {
      return c.json(createErrorResponse(404, "提现记录不存在"), 404);
    }
    const withdrawalData = withdrawal;
    if (withdrawalData.status !== "pending") {
      return c.json(createErrorResponse(400, "只能审核待处理的提现申请"), 400);
    }
    if (status === "approved") {
      await c.env.DB.prepare(`
        UPDATE withdrawals 
        SET status = 'processing', processed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(withdrawalId).run();
      try {
        const transferResult = await WechatPayService.transferToWallet(
          c,
          withdrawalId,
          withdrawalData.amount,
          withdrawalData.user_id,
          `创作者提现 - ${withdrawalData.amount}元`
        );
        if (transferResult.success && transferResult.data) {
          await c.env.DB.prepare(`
            UPDATE withdrawals 
            SET status = 'completed', batch_id = ?, transfer_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(transferResult.data.batch_id, transferResult.data.out_batch_no, withdrawalId).run();
        } else {
          await c.env.DB.prepare(`
            UPDATE withdrawals 
            SET status = 'failed', failure_reason = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(`微信商家转账失败: ${transferResult.error}`, withdrawalId).run();
          await c.env.DB.prepare(`
            UPDATE users SET balance = balance + ? WHERE id = ?
          `).bind(withdrawalData.amount, withdrawalData.user_id).run();
        }
      } catch (error) {
        console.error("微信商家转账处理失败:", error);
        await c.env.DB.prepare(`
          UPDATE withdrawals 
          SET status = 'failed', failure_reason = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(`商家转账处理异常: ${error instanceof Error ? error.message : "未知错误"}`, withdrawalId).run();
        await c.env.DB.prepare(`
          UPDATE users SET balance = balance + ? WHERE id = ?
        `).bind(withdrawalData.amount, withdrawalData.user_id).run();
      }
    } else {
      await c.env.DB.prepare(`
        UPDATE withdrawals 
        SET status = 'failed', failure_reason = ?, processed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(admin_comment || null, withdrawalId).run();
      await c.env.DB.prepare(`
        UPDATE users SET balance = balance + ? WHERE id = ?
      `).bind(withdrawalData.amount, withdrawalData.user_id).run();
      await c.env.DB.prepare(`
        INSERT INTO transactions (user_id, amount, type, transaction_type, description, created_at)
        VALUES (?, ?, 'withdrawal', 'withdrawal', ?, datetime('now'))
      `).bind(
        withdrawalData.user_id,
        withdrawalData.amount,
        `提现申请被拒绝，退还金额：${admin_comment || "无"}`
      ).run();
    }
    return c.json(createSuccessResponse({
      message: `提现申请${status === "approved" ? "通过" : "拒绝"}成功`
    }));
  } catch (error) {
    console.error("审核提现申请失败:", error);
    return c.json(createErrorResponse(500, "审核提现申请失败"), 500);
  }
});
app.post("/api/video-generation-tasks", authMiddleware, async (c) => {
  try {
    const { execute_id, workflow_id, token, notification_email, coze_workflow_id, user_id, title: title2, debug_url } = await c.req.json();
    if (!execute_id || !workflow_id || !token || !notification_email || !user_id) {
      return c.json(createErrorResponse(400, "缺少必要参数"), 400);
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO video_generation_tasks (execute_id, workflow_id, token, notification_email, coze_workflow_id, user_id, title, debug_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(execute_id, workflow_id, token, notification_email, coze_workflow_id || null, user_id, title2 || null, debug_url || null).run();
    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      execute_id,
      workflow_id,
      status: "running",
      title: title2,
      debug_url
    }));
  } catch (error) {
    console.error("创建视频生成任务失败:", error);
    return c.json(createErrorResponse(500, "创建视频生成任务失败"), 500);
  }
});
app.get("/api/video-generation-tasks", authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "20");
    const status = c.req.query("status");
    const offset = (page - 1) * pageSize;
    let whereClause = "";
    let params = [];
    if (status) {
      whereClause = "WHERE vgt.status = ?";
      params.push(status);
    }
    const tasks = await c.env.DB.prepare(`
      SELECT vgt.*, u.username, u.email as user_email, cw.title as workflow_title
      FROM video_generation_tasks vgt
      LEFT JOIN users u ON vgt.user_id = u.id
      LEFT JOIN coze_workflows cw ON vgt.coze_workflow_id = cw.id
      ${whereClause}
      ORDER BY vgt.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM video_generation_tasks vgt ${whereClause}
    `).bind(...params).first();
    const total = totalResult?.count || 0;
    return c.json(createSuccessResponse({
      items: tasks.results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }));
  } catch (error) {
    console.error("获取视频生成任务列表失败:", error);
    return c.json(createErrorResponse(500, "获取视频生成任务列表失败"), 500);
  }
});
app.get("/api/video-generation-tasks/:execute_id", authMiddleware, async (c) => {
  try {
    const execute_id = c.req.param("execute_id");
    const currentUser = c.get("user");
    const task = await c.env.DB.prepare(`
      SELECT vgt.*, u.username, u.email as user_email, cw.title as workflow_title
      FROM video_generation_tasks vgt
      LEFT JOIN users u ON vgt.user_id = u.id
      LEFT JOIN coze_workflows cw ON vgt.coze_workflow_id = cw.id
      WHERE vgt.execute_id = ? AND vgt.user_id = ?
    `).bind(execute_id, currentUser.id).first();
    if (!task) {
      return c.json(createErrorResponse(404, "视频生成任务不存在"), 404);
    }
    return c.json(createSuccessResponse(task));
  } catch (error) {
    console.error("获取视频生成任务详情失败:", error);
    return c.json(createErrorResponse(500, "获取视频生成任务详情失败"), 500);
  }
});
app.get("/api/admin/video-generation-tasks/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const task = await c.env.DB.prepare(`
      SELECT vgt.*, u.username, u.email as user_email, cw.title as workflow_title
      FROM video_generation_tasks vgt
      LEFT JOIN users u ON vgt.user_id = u.id
      LEFT JOIN coze_workflows cw ON vgt.coze_workflow_id = cw.id
      WHERE vgt.id = ?
    `).bind(id).first();
    if (!task) {
      return c.json(createErrorResponse(404, "视频生成任务不存在"), 404);
    }
    return c.json(createSuccessResponse(task));
  } catch (error) {
    console.error("获取视频生成任务详情失败:", error);
    return c.json(createErrorResponse(500, "获取视频生成任务详情失败"), 500);
  }
});
app.put("/api/video-generation-tasks/:id/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const { status, result_data, error_message } = await c.req.json();
    if (!status || !["running", "completed", "failed", "timeout"].includes(status)) {
      return c.json(createErrorResponse(400, "无效的状态值"), 400);
    }
    let updateFields = "status = ?, updated_at = datetime('now')";
    let params = [status];
    if (status === "completed" || status === "failed" || status === "timeout") {
      updateFields += ", completed_at = datetime('now')";
    }
    if (result_data) {
      updateFields += ", result_data = ?";
      params.push(JSON.stringify(result_data));
    }
    if (error_message) {
      updateFields += ", error_message = ?";
      params.push(error_message);
    }
    params.push(id);
    await c.env.DB.prepare(`
      UPDATE video_generation_tasks 
      SET ${updateFields}
      WHERE id = ?
    `).bind(...params).run();
    return c.json(createSuccessResponse({ message: "任务状态更新成功" }));
  } catch (error) {
    console.error("更新视频生成任务状态失败:", error);
    return c.json(createErrorResponse(500, "更新视频生成任务状态失败"), 500);
  }
});
app.get("/api/video-generation-tasks/:id/check-status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const task = await c.env.DB.prepare(`
      SELECT * FROM video_generation_tasks WHERE id = ?
    `).bind(id).first();
    if (!task) {
      return c.json(createErrorResponse(404, "视频生成任务不存在"), 404);
    }
    if (task.status !== "running") {
      return c.json(createSuccessResponse({
        status: task.status,
        result_data: task.result_data ? JSON.parse(task.result_data) : null,
        error_message: task.error_message
      }));
    }
    const response = await fetch(`https://api.coze.cn/v1/workflows/${task.workflow_id}/run_histories/${task.execute_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${task.token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Coze API查询失败: ${response.status} ${response.statusText}`);
    }
    const apiResult = await response.json();
    let newStatus = "running";
    let resultData = null;
    let errorMessage = null;
    const typedApiResult = apiResult;
    if (typedApiResult.data && Array.isArray(typedApiResult.data) && typedApiResult.data.length > 0) {
      const statusData = typedApiResult.data[0];
      const executeStatus = statusData.execute_status;
      if (executeStatus === "SUCCESS") {
        newStatus = "completed";
        resultData = statusData;
      } else if (executeStatus === "FAIL") {
        newStatus = "failed";
        errorMessage = statusData.error_message || "执行失败";
      } else if (executeStatus === "TIMEOUT") {
        newStatus = "timeout";
        errorMessage = "执行超时";
      }
    }
    if (newStatus !== "running") {
      let updateFields = "status = ?, updated_at = datetime('now'), completed_at = datetime('now')";
      let params = [newStatus];
      if (resultData) {
        updateFields += ", result_data = ?";
        params.push(JSON.stringify(resultData));
      }
      if (errorMessage) {
        updateFields += ", error_message = ?";
        params.push(errorMessage);
      }
      params.push(id);
      await c.env.DB.prepare(`
        UPDATE video_generation_tasks 
        SET ${updateFields}
        WHERE id = ?
      `).bind(...params).run();
    }
    return c.json(createSuccessResponse({
      status: newStatus,
      result_data: resultData,
      error_message: errorMessage,
      raw_api_response: apiResult
    }));
  } catch (error) {
    console.error("查询视频生成任务状态失败:", error);
    return c.json(createErrorResponse(500, "查询视频生成任务状态失败"), 500);
  }
});
app.notFound((c) => {
  return c.json(createErrorResponse(404, "接口不存在"), 404);
});
app.onError((err, c) => {
  console.error("Application error:", err);
  return c.json(createErrorResponse(500, "服务器内部错误"), 500);
});
app.post("/api/admin/video-task-monitor/start", authMiddleware, adminMiddleware, async (c) => {
  try {
    const monitor = startVideoTaskMonitor(c.env);
    return c.json(createSuccessResponse({
      message: "视频任务监控服务已启动",
      status: monitor.getStatus()
    }));
  } catch (error) {
    console.error("启动视频任务监控服务失败:", error);
    return c.json(createErrorResponse(500, "启动视频任务监控服务失败"), 500);
  }
});
app.post("/api/admin/video-task-monitor/stop", authMiddleware, adminMiddleware, async (c) => {
  try {
    stopVideoTaskMonitor();
    return c.json(createSuccessResponse({
      message: "视频任务监控服务已停止"
    }));
  } catch (error) {
    console.error("停止视频任务监控服务失败:", error);
    return c.json(createErrorResponse(500, "停止视频任务监控服务失败"), 500);
  }
});
app.get("/api/admin/video-task-monitor/status", authMiddleware, adminMiddleware, async (c) => {
  try {
    const { getVideoTaskMonitor: getVideoTaskMonitor2 } = await Promise.resolve().then(() => videoTaskMonitor);
    const monitor = getVideoTaskMonitor2(c.env);
    return c.json(createSuccessResponse({
      status: monitor.getStatus()
    }));
  } catch (error) {
    console.error("获取视频任务监控服务状态失败:", error);
    return c.json(createErrorResponse(500, "获取监控服务状态失败"), 500);
  }
});
app.post("/api/coze-workflows/:id/run", authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param("id"));
    const user = c.get("user");
    const body = await c.req.json();
    const { content, parameters, notification_email } = body;
    if (isNaN(workflowId)) {
      return c.json(createErrorResponse(400, "无效的工作流ID"), 400);
    }
    const workflow = await c.env.DB.prepare(`
      SELECT id, title, price, coze_api, creator_id, is_member_free
      FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();
    if (!workflow) {
      return c.json(createErrorResponse(404, "Coze工作流不存在或已下线"), 404);
    }
    const userBalance = await c.env.DB.prepare(`
      SELECT wh_coins FROM users WHERE id = ?
    `).bind(user.id).first();
    const currentBalance = userBalance?.wh_coins || 0;
    const workflowPrice = workflow.price || 0;
    const isFree = workflow.is_member_free && user.membership_type !== "basic";
    if (!isFree && workflowPrice > 0 && currentBalance < workflowPrice) {
      return c.json(createErrorResponse(400, `WH币余额不足，需要 ${workflowPrice} WH币，当前余额 ${currentBalance} WH币`), 400);
    }
    if (!isFree && workflowPrice > 0) {
      await c.env.DB.prepare(`
        UPDATE users SET wh_coins = wh_coins - ? WHERE id = ?
      `).bind(workflowPrice, user.id).run();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await c.env.DB.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, status, created_at, updated_at)
        VALUES (?, 'coze_workflow_run', ?, ?, 'completed', ?, ?)
      `).bind(user.id, -workflowPrice, `运行Coze工作流: ${workflow.title}`, now, now).run();
    }
    const cozeApi = workflow.coze_api;
    if (!cozeApi) {
      return c.json(createErrorResponse(400, "工作流缺少API配置"), 400);
    }
    const authMatch = cozeApi.match(/Authorization:\s*Bearer\s+([^\s\\]+)/);
    if (!authMatch) {
      return c.json(createErrorResponse(400, "无法从API配置中提取Authorization token"), 400);
    }
    const authToken = authMatch[1];
    let cozeWorkflowId = "";
    const workflowUrlMatch = cozeApi.match(/\/v1\/(workflow|workflows)\/(\w+)\/run/);
    if (workflowUrlMatch) {
      cozeWorkflowId = workflowUrlMatch[2];
    } else {
      const workflowIdJsonMatch = cozeApi.match(/workflow_id\s*:\s*(\d+)/);
      if (workflowIdJsonMatch) {
        cozeWorkflowId = workflowIdJsonMatch[1];
      } else {
        return c.json(createErrorResponse(400, "无法从API配置中提取工作流ID"), 400);
      }
    }
    let requestParams = {};
    if (parameters) {
      Object.keys(parameters).forEach((key) => {
        if (key !== "notification_email" && parameters[key]) {
          requestParams[key] = parameters[key];
        }
      });
    } else if (content) {
      requestParams.content = content;
    }
    try {
      const response = await fetch(`https://api.coze.cn/v1/workflow/run`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflow_id: cozeWorkflowId,
          parameters: requestParams,
          is_async: true
        })
      });
      const result = await response.json();
      if (response.ok && result.execute_id) {
        if (notification_email) {
          try {
            const now = (/* @__PURE__ */ new Date()).toISOString();
            await c.env.DB.prepare(`
              INSERT INTO video_generation_tasks (
                execute_id, workflow_id, token, notification_email, 
                title, coze_workflow_id, status, created_at, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            `).bind(
              result.execute_id,
              cozeWorkflowId,
              authToken,
              notification_email,
              workflow.title,
              workflowId,
              now,
              now
            ).run();
          } catch (error) {
            console.error("创建视频生成任务失败:", error);
          }
        }
        return c.json(createSuccessResponse({
          status: "running",
          execute_id: result.execute_id,
          workflow_id: cozeWorkflowId,
          message: "Coze工作流已成功提交运行"
        }));
      } else {
        if (!isFree && workflowPrice > 0) {
          await c.env.DB.prepare(`
            UPDATE users SET wh_coins = wh_coins + ? WHERE id = ?
          `).bind(workflowPrice, user.id).run();
        }
        return c.json(createErrorResponse(400, `Coze API调用失败: ${result.message || "未知错误"}`), 400);
      }
    } catch (error) {
      console.error("调用Coze API失败:", error);
      if (!isFree && workflowPrice > 0) {
        await c.env.DB.prepare(`
          UPDATE users SET wh_coins = wh_coins + ? WHERE id = ?
        `).bind(workflowPrice, user.id).run();
      }
      return c.json(createErrorResponse(500, "Coze API调用失败，请稍后重试"), 500);
    }
  } catch (error) {
    console.error("运行Coze工作流失败:", error);
    return c.json(createErrorResponse(500, "运行工作流失败", "server", "服务器内部错误"), 500);
  }
});
async function scheduled(_event, env2, _ctx) {
  console.log("Cron触发器执行: 开始检查佣金发放");
  try {
    const { getCommissionPayoutMonitor: getCommissionPayoutMonitor2 } = await Promise.resolve().then(() => commissionPayoutMonitor);
    const monitor = getCommissionPayoutMonitor2(env2);
    await monitor.checkPendingPayouts();
    console.log("Cron触发器完成: 佣金检查执行完毕");
  } catch (error) {
    console.error("Cron触发器执行失败:", error);
  }
}
const index = {
  fetch: app.fetch,
  scheduled
};
export {
  app,
  index as default
};
