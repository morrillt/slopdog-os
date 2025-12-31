"use strict";(()=>{var Z1=Object.create;var Ha=Object.defineProperty;var G1=Object.getOwnPropertyDescriptor;var X1=Object.getOwnPropertyNames;var Y1=Object.getPrototypeOf,K1=Object.prototype.hasOwnProperty;var qn=(e,n)=>()=>(n||e((n={exports:{}}).exports,n),n.exports),Qo=(e,n)=>{for(var t in n)Ha(e,t,{get:n[t],enumerable:!0})},J1=(e,n,t,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let o of X1(n))!K1.call(e,o)&&o!==t&&Ha(e,o,{get:()=>n[o],enumerable:!(r=G1(n,o))||r.enumerable});return e};var A=(e,n,t)=>(t=e!=null?Z1(Y1(e)):{},J1(n||!e||!e.__esModule?Ha(t,"default",{value:e,enumerable:!0}):t,e));var n0=qn(O=>{"use strict";var Vr=Symbol.for("react.element"),eh=Symbol.for("react.portal"),nh=Symbol.for("react.fragment"),th=Symbol.for("react.strict_mode"),rh=Symbol.for("react.profiler"),oh=Symbol.for("react.provider"),uh=Symbol.for("react.context"),ah=Symbol.for("react.forward_ref"),ih=Symbol.for("react.suspense"),sh=Symbol.for("react.memo"),lh=Symbol.for("react.lazy"),Vc=Symbol.iterator;function ch(e){return e===null||typeof e!="object"?null:(e=Vc&&e[Vc]||e["@@iterator"],typeof e=="function"?e:null)}var Qc={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Zc=Object.assign,Gc={};function ur(e,n,t){this.props=e,this.context=n,this.refs=Gc,this.updater=t||Qc}ur.prototype.isReactComponent={};ur.prototype.setState=function(e,n){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,n,"setState")};ur.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Xc(){}Xc.prototype=ur.prototype;function $a(e,n,t){this.props=e,this.context=n,this.refs=Gc,this.updater=t||Qc}var Wa=$a.prototype=new Xc;Wa.constructor=$a;Zc(Wa,ur.prototype);Wa.isPureReactComponent=!0;var $c=Array.isArray,Yc=Object.prototype.hasOwnProperty,Qa={current:null},Kc={key:!0,ref:!0,__self:!0,__source:!0};function Jc(e,n,t){var r,o={},u=null,a=null;if(n!=null)for(r in n.ref!==void 0&&(a=n.ref),n.key!==void 0&&(u=""+n.key),n)Yc.call(n,r)&&!Kc.hasOwnProperty(r)&&(o[r]=n[r]);var i=arguments.length-2;if(i===1)o.children=t;else if(1<i){for(var s=Array(i),l=0;l<i;l++)s[l]=arguments[l+2];o.children=s}if(e&&e.defaultProps)for(r in i=e.defaultProps,i)o[r]===void 0&&(o[r]=i[r]);return{$$typeof:Vr,type:e,key:u,ref:a,props:o,_owner:Qa.current}}function dh(e,n){return{$$typeof:Vr,type:e.type,key:n,ref:e.ref,props:e.props,_owner:e._owner}}function Za(e){return typeof e=="object"&&e!==null&&e.$$typeof===Vr}function ph(e){var n={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(t){return n[t]})}var Wc=/\/+/g;function Va(e,n){return typeof e=="object"&&e!==null&&e.key!=null?ph(""+e.key):n.toString(36)}function Go(e,n,t,r,o){var u=typeof e;(u==="undefined"||u==="boolean")&&(e=null);var a=!1;if(e===null)a=!0;else switch(u){case"string":case"number":a=!0;break;case"object":switch(e.$$typeof){case Vr:case eh:a=!0}}if(a)return a=e,o=o(a),e=r===""?"."+Va(a,0):r,$c(o)?(t="",e!=null&&(t=e.replace(Wc,"$&/")+"/"),Go(o,n,t,"",function(l){return l})):o!=null&&(Za(o)&&(o=dh(o,t+(!o.key||a&&a.key===o.key?"":(""+o.key).replace(Wc,"$&/")+"/")+e)),n.push(o)),1;if(a=0,r=r===""?".":r+":",$c(e))for(var i=0;i<e.length;i++){u=e[i];var s=r+Va(u,i);a+=Go(u,n,t,s,o)}else if(s=ch(e),typeof s=="function")for(e=s.call(e),i=0;!(u=e.next()).done;)u=u.value,s=r+Va(u,i++),a+=Go(u,n,t,s,o);else if(u==="object")throw n=String(e),Error("Objects are not valid as a React child (found: "+(n==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":n)+"). If you meant to render a collection of children, use an array instead.");return a}function Zo(e,n,t){if(e==null)return e;var r=[],o=0;return Go(e,r,"","",function(u){return n.call(t,u,o++)}),r}function fh(e){if(e._status===-1){var n=e._result;n=n(),n.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=n)}if(e._status===1)return e._result.default;throw e._result}var Ne={current:null},Xo={transition:null},mh={ReactCurrentDispatcher:Ne,ReactCurrentBatchConfig:Xo,ReactCurrentOwner:Qa};function e0(){throw Error("act(...) is not supported in production builds of React.")}O.Children={map:Zo,forEach:function(e,n,t){Zo(e,function(){n.apply(this,arguments)},t)},count:function(e){var n=0;return Zo(e,function(){n++}),n},toArray:function(e){return Zo(e,function(n){return n})||[]},only:function(e){if(!Za(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};O.Component=ur;O.Fragment=nh;O.Profiler=rh;O.PureComponent=$a;O.StrictMode=th;O.Suspense=ih;O.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=mh;O.act=e0;O.cloneElement=function(e,n,t){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=Zc({},e.props),o=e.key,u=e.ref,a=e._owner;if(n!=null){if(n.ref!==void 0&&(u=n.ref,a=Qa.current),n.key!==void 0&&(o=""+n.key),e.type&&e.type.defaultProps)var i=e.type.defaultProps;for(s in n)Yc.call(n,s)&&!Kc.hasOwnProperty(s)&&(r[s]=n[s]===void 0&&i!==void 0?i[s]:n[s])}var s=arguments.length-2;if(s===1)r.children=t;else if(1<s){i=Array(s);for(var l=0;l<s;l++)i[l]=arguments[l+2];r.children=i}return{$$typeof:Vr,type:e.type,key:o,ref:u,props:r,_owner:a}};O.createContext=function(e){return e={$$typeof:uh,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:oh,_context:e},e.Consumer=e};O.createElement=Jc;O.createFactory=function(e){var n=Jc.bind(null,e);return n.type=e,n};O.createRef=function(){return{current:null}};O.forwardRef=function(e){return{$$typeof:ah,render:e}};O.isValidElement=Za;O.lazy=function(e){return{$$typeof:lh,_payload:{_status:-1,_result:e},_init:fh}};O.memo=function(e,n){return{$$typeof:sh,type:e,compare:n===void 0?null:n}};O.startTransition=function(e){var n=Xo.transition;Xo.transition={};try{e()}finally{Xo.transition=n}};O.unstable_act=e0;O.useCallback=function(e,n){return Ne.current.useCallback(e,n)};O.useContext=function(e){return Ne.current.useContext(e)};O.useDebugValue=function(){};O.useDeferredValue=function(e){return Ne.current.useDeferredValue(e)};O.useEffect=function(e,n){return Ne.current.useEffect(e,n)};O.useId=function(){return Ne.current.useId()};O.useImperativeHandle=function(e,n,t){return Ne.current.useImperativeHandle(e,n,t)};O.useInsertionEffect=function(e,n){return Ne.current.useInsertionEffect(e,n)};O.useLayoutEffect=function(e,n){return Ne.current.useLayoutEffect(e,n)};O.useMemo=function(e,n){return Ne.current.useMemo(e,n)};O.useReducer=function(e,n,t){return Ne.current.useReducer(e,n,t)};O.useRef=function(e){return Ne.current.useRef(e)};O.useState=function(e){return Ne.current.useState(e)};O.useSyncExternalStore=function(e,n,t){return Ne.current.useSyncExternalStore(e,n,t)};O.useTransition=function(){return Ne.current.useTransition()};O.version="18.3.1"});var xe=qn((Rv,t0)=>{"use strict";t0.exports=n0()});var p0=qn(X=>{"use strict";function Ka(e,n){var t=e.length;e.push(n);e:for(;0<t;){var r=t-1>>>1,o=e[r];if(0<Yo(o,n))e[r]=n,e[t]=o,t=r;else break e}}function fn(e){return e.length===0?null:e[0]}function Jo(e){if(e.length===0)return null;var n=e[0],t=e.pop();if(t!==n){e[0]=t;e:for(var r=0,o=e.length,u=o>>>1;r<u;){var a=2*(r+1)-1,i=e[a],s=a+1,l=e[s];if(0>Yo(i,t))s<o&&0>Yo(l,i)?(e[r]=l,e[s]=t,r=s):(e[r]=i,e[a]=t,r=a);else if(s<o&&0>Yo(l,t))e[r]=l,e[s]=t,r=s;else break e}}return n}function Yo(e,n){var t=e.sortIndex-n.sortIndex;return t!==0?t:e.id-n.id}typeof performance=="object"&&typeof performance.now=="function"?(r0=performance,X.unstable_now=function(){return r0.now()}):(Ga=Date,o0=Ga.now(),X.unstable_now=function(){return Ga.now()-o0});var r0,Ga,o0,_n=[],at=[],hh=1,rn=null,Se=3,eu=!1,It=!1,Wr=!1,i0=typeof setTimeout=="function"?setTimeout:null,s0=typeof clearTimeout=="function"?clearTimeout:null,u0=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function Ja(e){for(var n=fn(at);n!==null;){if(n.callback===null)Jo(at);else if(n.startTime<=e)Jo(at),n.sortIndex=n.expirationTime,Ka(_n,n);else break;n=fn(at)}}function ei(e){if(Wr=!1,Ja(e),!It)if(fn(_n)!==null)It=!0,ti(ni);else{var n=fn(at);n!==null&&ri(ei,n.startTime-e)}}function ni(e,n){It=!1,Wr&&(Wr=!1,s0(Qr),Qr=-1),eu=!0;var t=Se;try{for(Ja(n),rn=fn(_n);rn!==null&&(!(rn.expirationTime>n)||e&&!d0());){var r=rn.callback;if(typeof r=="function"){rn.callback=null,Se=rn.priorityLevel;var o=r(rn.expirationTime<=n);n=X.unstable_now(),typeof o=="function"?rn.callback=o:rn===fn(_n)&&Jo(_n),Ja(n)}else Jo(_n);rn=fn(_n)}if(rn!==null)var u=!0;else{var a=fn(at);a!==null&&ri(ei,a.startTime-n),u=!1}return u}finally{rn=null,Se=t,eu=!1}}var nu=!1,Ko=null,Qr=-1,l0=5,c0=-1;function d0(){return!(X.unstable_now()-c0<l0)}function Xa(){if(Ko!==null){var e=X.unstable_now();c0=e;var n=!0;try{n=Ko(!0,e)}finally{n?$r():(nu=!1,Ko=null)}}else nu=!1}var $r;typeof u0=="function"?$r=function(){u0(Xa)}:typeof MessageChannel<"u"?(Ya=new MessageChannel,a0=Ya.port2,Ya.port1.onmessage=Xa,$r=function(){a0.postMessage(null)}):$r=function(){i0(Xa,0)};var Ya,a0;function ti(e){Ko=e,nu||(nu=!0,$r())}function ri(e,n){Qr=i0(function(){e(X.unstable_now())},n)}X.unstable_IdlePriority=5;X.unstable_ImmediatePriority=1;X.unstable_LowPriority=4;X.unstable_NormalPriority=3;X.unstable_Profiling=null;X.unstable_UserBlockingPriority=2;X.unstable_cancelCallback=function(e){e.callback=null};X.unstable_continueExecution=function(){It||eu||(It=!0,ti(ni))};X.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):l0=0<e?Math.floor(1e3/e):5};X.unstable_getCurrentPriorityLevel=function(){return Se};X.unstable_getFirstCallbackNode=function(){return fn(_n)};X.unstable_next=function(e){switch(Se){case 1:case 2:case 3:var n=3;break;default:n=Se}var t=Se;Se=n;try{return e()}finally{Se=t}};X.unstable_pauseExecution=function(){};X.unstable_requestPaint=function(){};X.unstable_runWithPriority=function(e,n){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var t=Se;Se=e;try{return n()}finally{Se=t}};X.unstable_scheduleCallback=function(e,n,t){var r=X.unstable_now();switch(typeof t=="object"&&t!==null?(t=t.delay,t=typeof t=="number"&&0<t?r+t:r):t=r,e){case 1:var o=-1;break;case 2:o=250;break;case 5:o=1073741823;break;case 4:o=1e4;break;default:o=5e3}return o=t+o,e={id:hh++,callback:n,priorityLevel:e,startTime:t,expirationTime:o,sortIndex:-1},t>r?(e.sortIndex=t,Ka(at,e),fn(_n)===null&&e===fn(at)&&(Wr?(s0(Qr),Qr=-1):Wr=!0,ri(ei,t-r))):(e.sortIndex=o,Ka(_n,e),It||eu||(It=!0,ti(ni))),e};X.unstable_shouldYield=d0;X.unstable_wrapCallback=function(e){var n=Se;return function(){var t=Se;Se=n;try{return e.apply(this,arguments)}finally{Se=t}}}});var m0=qn((Mv,f0)=>{"use strict";f0.exports=p0()});var bf=qn(Ke=>{"use strict";var gh=xe(),Xe=m0();function E(e){for(var n="https://reactjs.org/docs/error-decoder.html?invariant="+e,t=1;t<arguments.length;t++)n+="&args[]="+encodeURIComponent(arguments[t]);return"Minified React error #"+e+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var wd=new Set,go={};function Wt(e,n){Er(e,n),Er(e+"Capture",n)}function Er(e,n){for(go[e]=n,e=0;e<n.length;e++)wd.add(n[e])}var Zn=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Ei=Object.prototype.hasOwnProperty,xh=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,h0={},g0={};function vh(e){return Ei.call(g0,e)?!0:Ei.call(h0,e)?!1:xh.test(e)?g0[e]=!0:(h0[e]=!0,!1)}function bh(e,n,t,r){if(t!==null&&t.type===0)return!1;switch(typeof n){case"function":case"symbol":return!0;case"boolean":return r?!1:t!==null?!t.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function yh(e,n,t,r){if(n===null||typeof n>"u"||bh(e,n,t,r))return!0;if(r)return!1;if(t!==null)switch(t.type){case 3:return!n;case 4:return n===!1;case 5:return isNaN(n);case 6:return isNaN(n)||1>n}return!1}function Me(e,n,t,r,o,u,a){this.acceptsBooleans=n===2||n===3||n===4,this.attributeName=r,this.attributeNamespace=o,this.mustUseProperty=t,this.propertyName=e,this.type=n,this.sanitizeURL=u,this.removeEmptyString=a}var ye={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){ye[e]=new Me(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var n=e[0];ye[n]=new Me(n,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){ye[e]=new Me(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){ye[e]=new Me(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){ye[e]=new Me(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){ye[e]=new Me(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){ye[e]=new Me(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){ye[e]=new Me(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){ye[e]=new Me(e,5,!1,e.toLowerCase(),null,!1,!1)});var vs=/[\-:]([a-z])/g;function bs(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var n=e.replace(vs,bs);ye[n]=new Me(n,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var n=e.replace(vs,bs);ye[n]=new Me(n,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var n=e.replace(vs,bs);ye[n]=new Me(n,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){ye[e]=new Me(e,1,!1,e.toLowerCase(),null,!1,!1)});ye.xlinkHref=new Me("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){ye[e]=new Me(e,1,!1,e.toLowerCase(),null,!0,!0)});function ys(e,n,t,r){var o=ye.hasOwnProperty(n)?ye[n]:null;(o!==null?o.type!==0:r||!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(yh(n,t,o,r)&&(t=null),r||o===null?vh(n)&&(t===null?e.removeAttribute(n):e.setAttribute(n,""+t)):o.mustUseProperty?e[o.propertyName]=t===null?o.type===3?!1:"":t:(n=o.attributeName,r=o.attributeNamespace,t===null?e.removeAttribute(n):(o=o.type,t=o===3||o===4&&t===!0?"":""+t,r?e.setAttributeNS(r,n,t):e.setAttribute(n,t))))}var Kn=gh.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,tu=Symbol.for("react.element"),sr=Symbol.for("react.portal"),lr=Symbol.for("react.fragment"),ws=Symbol.for("react.strict_mode"),Ti=Symbol.for("react.profiler"),kd=Symbol.for("react.provider"),Cd=Symbol.for("react.context"),ks=Symbol.for("react.forward_ref"),Ai=Symbol.for("react.suspense"),Di=Symbol.for("react.suspense_list"),Cs=Symbol.for("react.memo"),st=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");var _d=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.cache");Symbol.for("react.tracing_marker");var x0=Symbol.iterator;function Zr(e){return e===null||typeof e!="object"?null:(e=x0&&e[x0]||e["@@iterator"],typeof e=="function"?e:null)}var re=Object.assign,oi;function to(e){if(oi===void 0)try{throw Error()}catch(t){var n=t.stack.trim().match(/\n( *(at )?)/);oi=n&&n[1]||""}return`
`+oi+e}var ui=!1;function ai(e,n){if(!e||ui)return"";ui=!0;var t=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(n)if(n=function(){throw Error()},Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(n,[])}catch(l){var r=l}Reflect.construct(e,[],n)}else{try{n.call()}catch(l){r=l}e.call(n.prototype)}else{try{throw Error()}catch(l){r=l}e()}}catch(l){if(l&&r&&typeof l.stack=="string"){for(var o=l.stack.split(`
`),u=r.stack.split(`
`),a=o.length-1,i=u.length-1;1<=a&&0<=i&&o[a]!==u[i];)i--;for(;1<=a&&0<=i;a--,i--)if(o[a]!==u[i]){if(a!==1||i!==1)do if(a--,i--,0>i||o[a]!==u[i]){var s=`
`+o[a].replace(" at new "," at ");return e.displayName&&s.includes("<anonymous>")&&(s=s.replace("<anonymous>",e.displayName)),s}while(1<=a&&0<=i);break}}}finally{ui=!1,Error.prepareStackTrace=t}return(e=e?e.displayName||e.name:"")?to(e):""}function wh(e){switch(e.tag){case 5:return to(e.type);case 16:return to("Lazy");case 13:return to("Suspense");case 19:return to("SuspenseList");case 0:case 2:case 15:return e=ai(e.type,!1),e;case 11:return e=ai(e.type.render,!1),e;case 1:return e=ai(e.type,!0),e;default:return""}}function Fi(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case lr:return"Fragment";case sr:return"Portal";case Ti:return"Profiler";case ws:return"StrictMode";case Ai:return"Suspense";case Di:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Cd:return(e.displayName||"Context")+".Consumer";case kd:return(e._context.displayName||"Context")+".Provider";case ks:var n=e.render;return e=e.displayName,e||(e=n.displayName||n.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Cs:return n=e.displayName||null,n!==null?n:Fi(e.type)||"Memo";case st:n=e._payload,e=e._init;try{return Fi(e(n))}catch{}}return null}function kh(e){var n=e.type;switch(e.tag){case 24:return"Cache";case 9:return(n.displayName||"Context")+".Consumer";case 10:return(n._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=n.render,e=e.displayName||e.name||"",n.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return n;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Fi(n);case 8:return n===ws?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof n=="function")return n.displayName||n.name||null;if(typeof n=="string")return n}return null}function kt(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Sd(e){var n=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function Ch(e){var n=Sd(e)?"checked":"value",t=Object.getOwnPropertyDescriptor(e.constructor.prototype,n),r=""+e[n];if(!e.hasOwnProperty(n)&&typeof t<"u"&&typeof t.get=="function"&&typeof t.set=="function"){var o=t.get,u=t.set;return Object.defineProperty(e,n,{configurable:!0,get:function(){return o.call(this)},set:function(a){r=""+a,u.call(this,a)}}),Object.defineProperty(e,n,{enumerable:t.enumerable}),{getValue:function(){return r},setValue:function(a){r=""+a},stopTracking:function(){e._valueTracker=null,delete e[n]}}}}function ru(e){e._valueTracker||(e._valueTracker=Ch(e))}function Ed(e){if(!e)return!1;var n=e._valueTracker;if(!n)return!0;var t=n.getValue(),r="";return e&&(r=Sd(e)?e.checked?"true":"false":e.value),e=r,e!==t?(n.setValue(e),!0):!1}function Nu(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function Ni(e,n){var t=n.checked;return re({},n,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:t??e._wrapperState.initialChecked})}function v0(e,n){var t=n.defaultValue==null?"":n.defaultValue,r=n.checked!=null?n.checked:n.defaultChecked;t=kt(n.value!=null?n.value:t),e._wrapperState={initialChecked:r,initialValue:t,controlled:n.type==="checkbox"||n.type==="radio"?n.checked!=null:n.value!=null}}function Td(e,n){n=n.checked,n!=null&&ys(e,"checked",n,!1)}function Ri(e,n){Td(e,n);var t=kt(n.value),r=n.type;if(t!=null)r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+t):e.value!==""+t&&(e.value=""+t);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}n.hasOwnProperty("value")?Ii(e,n.type,t):n.hasOwnProperty("defaultValue")&&Ii(e,n.type,kt(n.defaultValue)),n.checked==null&&n.defaultChecked!=null&&(e.defaultChecked=!!n.defaultChecked)}function b0(e,n,t){if(n.hasOwnProperty("value")||n.hasOwnProperty("defaultValue")){var r=n.type;if(!(r!=="submit"&&r!=="reset"||n.value!==void 0&&n.value!==null))return;n=""+e._wrapperState.initialValue,t||n===e.value||(e.value=n),e.defaultValue=n}t=e.name,t!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,t!==""&&(e.name=t)}function Ii(e,n,t){(n!=="number"||Nu(e.ownerDocument)!==e)&&(t==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+t&&(e.defaultValue=""+t))}var ro=Array.isArray;function yr(e,n,t,r){if(e=e.options,n){n={};for(var o=0;o<t.length;o++)n["$"+t[o]]=!0;for(t=0;t<e.length;t++)o=n.hasOwnProperty("$"+e[t].value),e[t].selected!==o&&(e[t].selected=o),o&&r&&(e[t].defaultSelected=!0)}else{for(t=""+kt(t),n=null,o=0;o<e.length;o++){if(e[o].value===t){e[o].selected=!0,r&&(e[o].defaultSelected=!0);return}n!==null||e[o].disabled||(n=e[o])}n!==null&&(n.selected=!0)}}function Mi(e,n){if(n.dangerouslySetInnerHTML!=null)throw Error(E(91));return re({},n,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function y0(e,n){var t=n.value;if(t==null){if(t=n.children,n=n.defaultValue,t!=null){if(n!=null)throw Error(E(92));if(ro(t)){if(1<t.length)throw Error(E(93));t=t[0]}n=t}n==null&&(n=""),t=n}e._wrapperState={initialValue:kt(t)}}function Ad(e,n){var t=kt(n.value),r=kt(n.defaultValue);t!=null&&(t=""+t,t!==e.value&&(e.value=t),n.defaultValue==null&&e.defaultValue!==t&&(e.defaultValue=t)),r!=null&&(e.defaultValue=""+r)}function w0(e){var n=e.textContent;n===e._wrapperState.initialValue&&n!==""&&n!==null&&(e.value=n)}function Dd(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Pi(e,n){return e==null||e==="http://www.w3.org/1999/xhtml"?Dd(n):e==="http://www.w3.org/2000/svg"&&n==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var ou,Fd=function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(n,t,r,o){MSApp.execUnsafeLocalFunction(function(){return e(n,t,r,o)})}:e}(function(e,n){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=n;else{for(ou=ou||document.createElement("div"),ou.innerHTML="<svg>"+n.valueOf().toString()+"</svg>",n=ou.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;n.firstChild;)e.appendChild(n.firstChild)}});function xo(e,n){if(n){var t=e.firstChild;if(t&&t===e.lastChild&&t.nodeType===3){t.nodeValue=n;return}}e.textContent=n}var ao={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},_h=["Webkit","ms","Moz","O"];Object.keys(ao).forEach(function(e){_h.forEach(function(n){n=n+e.charAt(0).toUpperCase()+e.substring(1),ao[n]=ao[e]})});function Nd(e,n,t){return n==null||typeof n=="boolean"||n===""?"":t||typeof n!="number"||n===0||ao.hasOwnProperty(e)&&ao[e]?(""+n).trim():n+"px"}function Rd(e,n){e=e.style;for(var t in n)if(n.hasOwnProperty(t)){var r=t.indexOf("--")===0,o=Nd(t,n[t],r);t==="float"&&(t="cssFloat"),r?e.setProperty(t,o):e[t]=o}}var Sh=re({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Li(e,n){if(n){if(Sh[e]&&(n.children!=null||n.dangerouslySetInnerHTML!=null))throw Error(E(137,e));if(n.dangerouslySetInnerHTML!=null){if(n.children!=null)throw Error(E(60));if(typeof n.dangerouslySetInnerHTML!="object"||!("__html"in n.dangerouslySetInnerHTML))throw Error(E(61))}if(n.style!=null&&typeof n.style!="object")throw Error(E(62))}}function zi(e,n){if(e.indexOf("-")===-1)return typeof n.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Oi=null;function _s(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Bi=null,wr=null,kr=null;function k0(e){if(e=Po(e)){if(typeof Bi!="function")throw Error(E(280));var n=e.stateNode;n&&(n=ua(n),Bi(e.stateNode,e.type,n))}}function Id(e){wr?kr?kr.push(e):kr=[e]:wr=e}function Md(){if(wr){var e=wr,n=kr;if(kr=wr=null,k0(e),n)for(e=0;e<n.length;e++)k0(n[e])}}function Pd(e,n){return e(n)}function Ld(){}var ii=!1;function zd(e,n,t){if(ii)return e(n,t);ii=!0;try{return Pd(e,n,t)}finally{ii=!1,(wr!==null||kr!==null)&&(Ld(),Md())}}function vo(e,n){var t=e.stateNode;if(t===null)return null;var r=ua(t);if(r===null)return null;t=r[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(t&&typeof t!="function")throw Error(E(231,n,typeof t));return t}var Ui=!1;if(Zn)try{ar={},Object.defineProperty(ar,"passive",{get:function(){Ui=!0}}),window.addEventListener("test",ar,ar),window.removeEventListener("test",ar,ar)}catch{Ui=!1}var ar;function Eh(e,n,t,r,o,u,a,i,s){var l=Array.prototype.slice.call(arguments,3);try{n.apply(t,l)}catch(f){this.onError(f)}}var io=!1,Ru=null,Iu=!1,ji=null,Th={onError:function(e){io=!0,Ru=e}};function Ah(e,n,t,r,o,u,a,i,s){io=!1,Ru=null,Eh.apply(Th,arguments)}function Dh(e,n,t,r,o,u,a,i,s){if(Ah.apply(this,arguments),io){if(io){var l=Ru;io=!1,Ru=null}else throw Error(E(198));Iu||(Iu=!0,ji=l)}}function Qt(e){var n=e,t=e;if(e.alternate)for(;n.return;)n=n.return;else{e=n;do n=e,(n.flags&4098)!==0&&(t=n.return),e=n.return;while(e)}return n.tag===3?t:null}function Od(e){if(e.tag===13){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function C0(e){if(Qt(e)!==e)throw Error(E(188))}function Fh(e){var n=e.alternate;if(!n){if(n=Qt(e),n===null)throw Error(E(188));return n!==e?null:e}for(var t=e,r=n;;){var o=t.return;if(o===null)break;var u=o.alternate;if(u===null){if(r=o.return,r!==null){t=r;continue}break}if(o.child===u.child){for(u=o.child;u;){if(u===t)return C0(o),e;if(u===r)return C0(o),n;u=u.sibling}throw Error(E(188))}if(t.return!==r.return)t=o,r=u;else{for(var a=!1,i=o.child;i;){if(i===t){a=!0,t=o,r=u;break}if(i===r){a=!0,r=o,t=u;break}i=i.sibling}if(!a){for(i=u.child;i;){if(i===t){a=!0,t=u,r=o;break}if(i===r){a=!0,r=u,t=o;break}i=i.sibling}if(!a)throw Error(E(189))}}if(t.alternate!==r)throw Error(E(190))}if(t.tag!==3)throw Error(E(188));return t.stateNode.current===t?e:n}function Bd(e){return e=Fh(e),e!==null?Ud(e):null}function Ud(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var n=Ud(e);if(n!==null)return n;e=e.sibling}return null}var jd=Xe.unstable_scheduleCallback,_0=Xe.unstable_cancelCallback,Nh=Xe.unstable_shouldYield,Rh=Xe.unstable_requestPaint,ae=Xe.unstable_now,Ih=Xe.unstable_getCurrentPriorityLevel,Ss=Xe.unstable_ImmediatePriority,qd=Xe.unstable_UserBlockingPriority,Mu=Xe.unstable_NormalPriority,Mh=Xe.unstable_LowPriority,Hd=Xe.unstable_IdlePriority,na=null,An=null;function Ph(e){if(An&&typeof An.onCommitFiberRoot=="function")try{An.onCommitFiberRoot(na,e,void 0,(e.current.flags&128)===128)}catch{}}var vn=Math.clz32?Math.clz32:Oh,Lh=Math.log,zh=Math.LN2;function Oh(e){return e>>>=0,e===0?32:31-(Lh(e)/zh|0)|0}var uu=64,au=4194304;function oo(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function Pu(e,n){var t=e.pendingLanes;if(t===0)return 0;var r=0,o=e.suspendedLanes,u=e.pingedLanes,a=t&268435455;if(a!==0){var i=a&~o;i!==0?r=oo(i):(u&=a,u!==0&&(r=oo(u)))}else a=t&~o,a!==0?r=oo(a):u!==0&&(r=oo(u));if(r===0)return 0;if(n!==0&&n!==r&&(n&o)===0&&(o=r&-r,u=n&-n,o>=u||o===16&&(u&4194240)!==0))return n;if((r&4)!==0&&(r|=t&16),n=e.entangledLanes,n!==0)for(e=e.entanglements,n&=r;0<n;)t=31-vn(n),o=1<<t,r|=e[t],n&=~o;return r}function Bh(e,n){switch(e){case 1:case 2:case 4:return n+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Uh(e,n){for(var t=e.suspendedLanes,r=e.pingedLanes,o=e.expirationTimes,u=e.pendingLanes;0<u;){var a=31-vn(u),i=1<<a,s=o[a];s===-1?((i&t)===0||(i&r)!==0)&&(o[a]=Bh(i,n)):s<=n&&(e.expiredLanes|=i),u&=~i}}function qi(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function Vd(){var e=uu;return uu<<=1,(uu&4194240)===0&&(uu=64),e}function si(e){for(var n=[],t=0;31>t;t++)n.push(e);return n}function Io(e,n,t){e.pendingLanes|=n,n!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,n=31-vn(n),e[n]=t}function jh(e,n){var t=e.pendingLanes&~n;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=n,e.mutableReadLanes&=n,e.entangledLanes&=n,n=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<t;){var o=31-vn(t),u=1<<o;n[o]=0,r[o]=-1,e[o]=-1,t&=~u}}function Es(e,n){var t=e.entangledLanes|=n;for(e=e.entanglements;t;){var r=31-vn(t),o=1<<r;o&n|e[r]&n&&(e[r]|=n),t&=~o}}var Q=0;function $d(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var Wd,Ts,Qd,Zd,Gd,Hi=!1,iu=[],mt=null,ht=null,gt=null,bo=new Map,yo=new Map,ct=[],qh="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function S0(e,n){switch(e){case"focusin":case"focusout":mt=null;break;case"dragenter":case"dragleave":ht=null;break;case"mouseover":case"mouseout":gt=null;break;case"pointerover":case"pointerout":bo.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":yo.delete(n.pointerId)}}function Gr(e,n,t,r,o,u){return e===null||e.nativeEvent!==u?(e={blockedOn:n,domEventName:t,eventSystemFlags:r,nativeEvent:u,targetContainers:[o]},n!==null&&(n=Po(n),n!==null&&Ts(n)),e):(e.eventSystemFlags|=r,n=e.targetContainers,o!==null&&n.indexOf(o)===-1&&n.push(o),e)}function Hh(e,n,t,r,o){switch(n){case"focusin":return mt=Gr(mt,e,n,t,r,o),!0;case"dragenter":return ht=Gr(ht,e,n,t,r,o),!0;case"mouseover":return gt=Gr(gt,e,n,t,r,o),!0;case"pointerover":var u=o.pointerId;return bo.set(u,Gr(bo.get(u)||null,e,n,t,r,o)),!0;case"gotpointercapture":return u=o.pointerId,yo.set(u,Gr(yo.get(u)||null,e,n,t,r,o)),!0}return!1}function Xd(e){var n=Lt(e.target);if(n!==null){var t=Qt(n);if(t!==null){if(n=t.tag,n===13){if(n=Od(t),n!==null){e.blockedOn=n,Gd(e.priority,function(){Qd(t)});return}}else if(n===3&&t.stateNode.current.memoizedState.isDehydrated){e.blockedOn=t.tag===3?t.stateNode.containerInfo:null;return}}}e.blockedOn=null}function wu(e){if(e.blockedOn!==null)return!1;for(var n=e.targetContainers;0<n.length;){var t=Vi(e.domEventName,e.eventSystemFlags,n[0],e.nativeEvent);if(t===null){t=e.nativeEvent;var r=new t.constructor(t.type,t);Oi=r,t.target.dispatchEvent(r),Oi=null}else return n=Po(t),n!==null&&Ts(n),e.blockedOn=t,!1;n.shift()}return!0}function E0(e,n,t){wu(e)&&t.delete(n)}function Vh(){Hi=!1,mt!==null&&wu(mt)&&(mt=null),ht!==null&&wu(ht)&&(ht=null),gt!==null&&wu(gt)&&(gt=null),bo.forEach(E0),yo.forEach(E0)}function Xr(e,n){e.blockedOn===n&&(e.blockedOn=null,Hi||(Hi=!0,Xe.unstable_scheduleCallback(Xe.unstable_NormalPriority,Vh)))}function wo(e){function n(o){return Xr(o,e)}if(0<iu.length){Xr(iu[0],e);for(var t=1;t<iu.length;t++){var r=iu[t];r.blockedOn===e&&(r.blockedOn=null)}}for(mt!==null&&Xr(mt,e),ht!==null&&Xr(ht,e),gt!==null&&Xr(gt,e),bo.forEach(n),yo.forEach(n),t=0;t<ct.length;t++)r=ct[t],r.blockedOn===e&&(r.blockedOn=null);for(;0<ct.length&&(t=ct[0],t.blockedOn===null);)Xd(t),t.blockedOn===null&&ct.shift()}var Cr=Kn.ReactCurrentBatchConfig,Lu=!0;function $h(e,n,t,r){var o=Q,u=Cr.transition;Cr.transition=null;try{Q=1,As(e,n,t,r)}finally{Q=o,Cr.transition=u}}function Wh(e,n,t,r){var o=Q,u=Cr.transition;Cr.transition=null;try{Q=4,As(e,n,t,r)}finally{Q=o,Cr.transition=u}}function As(e,n,t,r){if(Lu){var o=Vi(e,n,t,r);if(o===null)hi(e,n,r,zu,t),S0(e,r);else if(Hh(o,e,n,t,r))r.stopPropagation();else if(S0(e,r),n&4&&-1<qh.indexOf(e)){for(;o!==null;){var u=Po(o);if(u!==null&&Wd(u),u=Vi(e,n,t,r),u===null&&hi(e,n,r,zu,t),u===o)break;o=u}o!==null&&r.stopPropagation()}else hi(e,n,r,null,t)}}var zu=null;function Vi(e,n,t,r){if(zu=null,e=_s(r),e=Lt(e),e!==null)if(n=Qt(e),n===null)e=null;else if(t=n.tag,t===13){if(e=Od(n),e!==null)return e;e=null}else if(t===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;e=null}else n!==e&&(e=null);return zu=e,null}function Yd(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Ih()){case Ss:return 1;case qd:return 4;case Mu:case Mh:return 16;case Hd:return 536870912;default:return 16}default:return 16}}var pt=null,Ds=null,ku=null;function Kd(){if(ku)return ku;var e,n=Ds,t=n.length,r,o="value"in pt?pt.value:pt.textContent,u=o.length;for(e=0;e<t&&n[e]===o[e];e++);var a=t-e;for(r=1;r<=a&&n[t-r]===o[u-r];r++);return ku=o.slice(e,1<r?1-r:void 0)}function Cu(e){var n=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&n===13&&(e=13)):e=n,e===10&&(e=13),32<=e||e===13?e:0}function su(){return!0}function T0(){return!1}function Ye(e){function n(t,r,o,u,a){this._reactName=t,this._targetInst=o,this.type=r,this.nativeEvent=u,this.target=a,this.currentTarget=null;for(var i in e)e.hasOwnProperty(i)&&(t=e[i],this[i]=t?t(u):u[i]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?su:T0,this.isPropagationStopped=T0,this}return re(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var t=this.nativeEvent;t&&(t.preventDefault?t.preventDefault():typeof t.returnValue!="unknown"&&(t.returnValue=!1),this.isDefaultPrevented=su)},stopPropagation:function(){var t=this.nativeEvent;t&&(t.stopPropagation?t.stopPropagation():typeof t.cancelBubble!="unknown"&&(t.cancelBubble=!0),this.isPropagationStopped=su)},persist:function(){},isPersistent:su}),n}var Ir={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Fs=Ye(Ir),Mo=re({},Ir,{view:0,detail:0}),Qh=Ye(Mo),li,ci,Yr,ta=re({},Mo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Ns,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Yr&&(Yr&&e.type==="mousemove"?(li=e.screenX-Yr.screenX,ci=e.screenY-Yr.screenY):ci=li=0,Yr=e),li)},movementY:function(e){return"movementY"in e?e.movementY:ci}}),A0=Ye(ta),Zh=re({},ta,{dataTransfer:0}),Gh=Ye(Zh),Xh=re({},Mo,{relatedTarget:0}),di=Ye(Xh),Yh=re({},Ir,{animationName:0,elapsedTime:0,pseudoElement:0}),Kh=Ye(Yh),Jh=re({},Ir,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),eg=Ye(Jh),ng=re({},Ir,{data:0}),D0=Ye(ng),tg={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},rg={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},og={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function ug(e){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(e):(e=og[e])?!!n[e]:!1}function Ns(){return ug}var ag=re({},Mo,{key:function(e){if(e.key){var n=tg[e.key]||e.key;if(n!=="Unidentified")return n}return e.type==="keypress"?(e=Cu(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?rg[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Ns,charCode:function(e){return e.type==="keypress"?Cu(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Cu(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),ig=Ye(ag),sg=re({},ta,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),F0=Ye(sg),lg=re({},Mo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Ns}),cg=Ye(lg),dg=re({},Ir,{propertyName:0,elapsedTime:0,pseudoElement:0}),pg=Ye(dg),fg=re({},ta,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),mg=Ye(fg),hg=[9,13,27,32],Rs=Zn&&"CompositionEvent"in window,so=null;Zn&&"documentMode"in document&&(so=document.documentMode);var gg=Zn&&"TextEvent"in window&&!so,Jd=Zn&&(!Rs||so&&8<so&&11>=so),N0=" ",R0=!1;function ep(e,n){switch(e){case"keyup":return hg.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function np(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var cr=!1;function xg(e,n){switch(e){case"compositionend":return np(n);case"keypress":return n.which!==32?null:(R0=!0,N0);case"textInput":return e=n.data,e===N0&&R0?null:e;default:return null}}function vg(e,n){if(cr)return e==="compositionend"||!Rs&&ep(e,n)?(e=Kd(),ku=Ds=pt=null,cr=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return Jd&&n.locale!=="ko"?null:n.data;default:return null}}var bg={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function I0(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n==="input"?!!bg[e.type]:n==="textarea"}function tp(e,n,t,r){Id(r),n=Ou(n,"onChange"),0<n.length&&(t=new Fs("onChange","change",null,t,r),e.push({event:t,listeners:n}))}var lo=null,ko=null;function yg(e){fp(e,0)}function ra(e){var n=fr(e);if(Ed(n))return e}function wg(e,n){if(e==="change")return n}var rp=!1;Zn&&(Zn?(cu="oninput"in document,cu||(pi=document.createElement("div"),pi.setAttribute("oninput","return;"),cu=typeof pi.oninput=="function"),lu=cu):lu=!1,rp=lu&&(!document.documentMode||9<document.documentMode));var lu,cu,pi;function M0(){lo&&(lo.detachEvent("onpropertychange",op),ko=lo=null)}function op(e){if(e.propertyName==="value"&&ra(ko)){var n=[];tp(n,ko,e,_s(e)),zd(yg,n)}}function kg(e,n,t){e==="focusin"?(M0(),lo=n,ko=t,lo.attachEvent("onpropertychange",op)):e==="focusout"&&M0()}function Cg(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return ra(ko)}function _g(e,n){if(e==="click")return ra(n)}function Sg(e,n){if(e==="input"||e==="change")return ra(n)}function Eg(e,n){return e===n&&(e!==0||1/e===1/n)||e!==e&&n!==n}var yn=typeof Object.is=="function"?Object.is:Eg;function Co(e,n){if(yn(e,n))return!0;if(typeof e!="object"||e===null||typeof n!="object"||n===null)return!1;var t=Object.keys(e),r=Object.keys(n);if(t.length!==r.length)return!1;for(r=0;r<t.length;r++){var o=t[r];if(!Ei.call(n,o)||!yn(e[o],n[o]))return!1}return!0}function P0(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function L0(e,n){var t=P0(e);e=0;for(var r;t;){if(t.nodeType===3){if(r=e+t.textContent.length,e<=n&&r>=n)return{node:t,offset:n-e};e=r}e:{for(;t;){if(t.nextSibling){t=t.nextSibling;break e}t=t.parentNode}t=void 0}t=P0(t)}}function up(e,n){return e&&n?e===n?!0:e&&e.nodeType===3?!1:n&&n.nodeType===3?up(e,n.parentNode):"contains"in e?e.contains(n):e.compareDocumentPosition?!!(e.compareDocumentPosition(n)&16):!1:!1}function ap(){for(var e=window,n=Nu();n instanceof e.HTMLIFrameElement;){try{var t=typeof n.contentWindow.location.href=="string"}catch{t=!1}if(t)e=n.contentWindow;else break;n=Nu(e.document)}return n}function Is(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n&&(n==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||n==="textarea"||e.contentEditable==="true")}function Tg(e){var n=ap(),t=e.focusedElem,r=e.selectionRange;if(n!==t&&t&&t.ownerDocument&&up(t.ownerDocument.documentElement,t)){if(r!==null&&Is(t)){if(n=r.start,e=r.end,e===void 0&&(e=n),"selectionStart"in t)t.selectionStart=n,t.selectionEnd=Math.min(e,t.value.length);else if(e=(n=t.ownerDocument||document)&&n.defaultView||window,e.getSelection){e=e.getSelection();var o=t.textContent.length,u=Math.min(r.start,o);r=r.end===void 0?u:Math.min(r.end,o),!e.extend&&u>r&&(o=r,r=u,u=o),o=L0(t,u);var a=L0(t,r);o&&a&&(e.rangeCount!==1||e.anchorNode!==o.node||e.anchorOffset!==o.offset||e.focusNode!==a.node||e.focusOffset!==a.offset)&&(n=n.createRange(),n.setStart(o.node,o.offset),e.removeAllRanges(),u>r?(e.addRange(n),e.extend(a.node,a.offset)):(n.setEnd(a.node,a.offset),e.addRange(n)))}}for(n=[],e=t;e=e.parentNode;)e.nodeType===1&&n.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<n.length;t++)e=n[t],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Ag=Zn&&"documentMode"in document&&11>=document.documentMode,dr=null,$i=null,co=null,Wi=!1;function z0(e,n,t){var r=t.window===t?t.document:t.nodeType===9?t:t.ownerDocument;Wi||dr==null||dr!==Nu(r)||(r=dr,"selectionStart"in r&&Is(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),co&&Co(co,r)||(co=r,r=Ou($i,"onSelect"),0<r.length&&(n=new Fs("onSelect","select",null,n,t),e.push({event:n,listeners:r}),n.target=dr)))}function du(e,n){var t={};return t[e.toLowerCase()]=n.toLowerCase(),t["Webkit"+e]="webkit"+n,t["Moz"+e]="moz"+n,t}var pr={animationend:du("Animation","AnimationEnd"),animationiteration:du("Animation","AnimationIteration"),animationstart:du("Animation","AnimationStart"),transitionend:du("Transition","TransitionEnd")},fi={},ip={};Zn&&(ip=document.createElement("div").style,"AnimationEvent"in window||(delete pr.animationend.animation,delete pr.animationiteration.animation,delete pr.animationstart.animation),"TransitionEvent"in window||delete pr.transitionend.transition);function oa(e){if(fi[e])return fi[e];if(!pr[e])return e;var n=pr[e],t;for(t in n)if(n.hasOwnProperty(t)&&t in ip)return fi[e]=n[t];return e}var sp=oa("animationend"),lp=oa("animationiteration"),cp=oa("animationstart"),dp=oa("transitionend"),pp=new Map,O0="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function _t(e,n){pp.set(e,n),Wt(n,[e])}for(pu=0;pu<O0.length;pu++)fu=O0[pu],B0=fu.toLowerCase(),U0=fu[0].toUpperCase()+fu.slice(1),_t(B0,"on"+U0);var fu,B0,U0,pu;_t(sp,"onAnimationEnd");_t(lp,"onAnimationIteration");_t(cp,"onAnimationStart");_t("dblclick","onDoubleClick");_t("focusin","onFocus");_t("focusout","onBlur");_t(dp,"onTransitionEnd");Er("onMouseEnter",["mouseout","mouseover"]);Er("onMouseLeave",["mouseout","mouseover"]);Er("onPointerEnter",["pointerout","pointerover"]);Er("onPointerLeave",["pointerout","pointerover"]);Wt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Wt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Wt("onBeforeInput",["compositionend","keypress","textInput","paste"]);Wt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Wt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Wt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var uo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Dg=new Set("cancel close invalid load scroll toggle".split(" ").concat(uo));function j0(e,n,t){var r=e.type||"unknown-event";e.currentTarget=t,Dh(r,n,void 0,e),e.currentTarget=null}function fp(e,n){n=(n&4)!==0;for(var t=0;t<e.length;t++){var r=e[t],o=r.event;r=r.listeners;e:{var u=void 0;if(n)for(var a=r.length-1;0<=a;a--){var i=r[a],s=i.instance,l=i.currentTarget;if(i=i.listener,s!==u&&o.isPropagationStopped())break e;j0(o,i,l),u=s}else for(a=0;a<r.length;a++){if(i=r[a],s=i.instance,l=i.currentTarget,i=i.listener,s!==u&&o.isPropagationStopped())break e;j0(o,i,l),u=s}}}if(Iu)throw e=ji,Iu=!1,ji=null,e}function K(e,n){var t=n[Yi];t===void 0&&(t=n[Yi]=new Set);var r=e+"__bubble";t.has(r)||(mp(n,e,2,!1),t.add(r))}function mi(e,n,t){var r=0;n&&(r|=4),mp(t,e,r,n)}var mu="_reactListening"+Math.random().toString(36).slice(2);function _o(e){if(!e[mu]){e[mu]=!0,wd.forEach(function(t){t!=="selectionchange"&&(Dg.has(t)||mi(t,!1,e),mi(t,!0,e))});var n=e.nodeType===9?e:e.ownerDocument;n===null||n[mu]||(n[mu]=!0,mi("selectionchange",!1,n))}}function mp(e,n,t,r){switch(Yd(n)){case 1:var o=$h;break;case 4:o=Wh;break;default:o=As}t=o.bind(null,n,t,e),o=void 0,!Ui||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(o=!0),r?o!==void 0?e.addEventListener(n,t,{capture:!0,passive:o}):e.addEventListener(n,t,!0):o!==void 0?e.addEventListener(n,t,{passive:o}):e.addEventListener(n,t,!1)}function hi(e,n,t,r,o){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)e:for(;;){if(r===null)return;var a=r.tag;if(a===3||a===4){var i=r.stateNode.containerInfo;if(i===o||i.nodeType===8&&i.parentNode===o)break;if(a===4)for(a=r.return;a!==null;){var s=a.tag;if((s===3||s===4)&&(s=a.stateNode.containerInfo,s===o||s.nodeType===8&&s.parentNode===o))return;a=a.return}for(;i!==null;){if(a=Lt(i),a===null)return;if(s=a.tag,s===5||s===6){r=u=a;continue e}i=i.parentNode}}r=r.return}zd(function(){var l=u,f=_s(t),m=[];e:{var g=pp.get(e);if(g!==void 0){var v=Fs,x=e;switch(e){case"keypress":if(Cu(t)===0)break e;case"keydown":case"keyup":v=ig;break;case"focusin":x="focus",v=di;break;case"focusout":x="blur",v=di;break;case"beforeblur":case"afterblur":v=di;break;case"click":if(t.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":v=A0;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":v=Gh;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":v=cg;break;case sp:case lp:case cp:v=Kh;break;case dp:v=pg;break;case"scroll":v=Qh;break;case"wheel":v=mg;break;case"copy":case"cut":case"paste":v=eg;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":v=F0}var w=(n&4)!==0,C=!w&&e==="scroll",h=w?g!==null?g+"Capture":null:g;w=[];for(var d=l,c;d!==null;){c=d;var p=c.stateNode;if(c.tag===5&&p!==null&&(c=p,h!==null&&(p=vo(d,h),p!=null&&w.push(So(d,p,c)))),C)break;d=d.return}0<w.length&&(g=new v(g,x,null,t,f),m.push({event:g,listeners:w}))}}if((n&7)===0){e:{if(g=e==="mouseover"||e==="pointerover",v=e==="mouseout"||e==="pointerout",g&&t!==Oi&&(x=t.relatedTarget||t.fromElement)&&(Lt(x)||x[Gn]))break e;if((v||g)&&(g=f.window===f?f:(g=f.ownerDocument)?g.defaultView||g.parentWindow:window,v?(x=t.relatedTarget||t.toElement,v=l,x=x?Lt(x):null,x!==null&&(C=Qt(x),x!==C||x.tag!==5&&x.tag!==6)&&(x=null)):(v=null,x=l),v!==x)){if(w=A0,p="onMouseLeave",h="onMouseEnter",d="mouse",(e==="pointerout"||e==="pointerover")&&(w=F0,p="onPointerLeave",h="onPointerEnter",d="pointer"),C=v==null?g:fr(v),c=x==null?g:fr(x),g=new w(p,d+"leave",v,t,f),g.target=C,g.relatedTarget=c,p=null,Lt(f)===l&&(w=new w(h,d+"enter",x,t,f),w.target=c,w.relatedTarget=C,p=w),C=p,v&&x)n:{for(w=v,h=x,d=0,c=w;c;c=ir(c))d++;for(c=0,p=h;p;p=ir(p))c++;for(;0<d-c;)w=ir(w),d--;for(;0<c-d;)h=ir(h),c--;for(;d--;){if(w===h||h!==null&&w===h.alternate)break n;w=ir(w),h=ir(h)}w=null}else w=null;v!==null&&q0(m,g,v,w,!1),x!==null&&C!==null&&q0(m,C,x,w,!0)}}e:{if(g=l?fr(l):window,v=g.nodeName&&g.nodeName.toLowerCase(),v==="select"||v==="input"&&g.type==="file")var b=wg;else if(I0(g))if(rp)b=Sg;else{b=Cg;var y=kg}else(v=g.nodeName)&&v.toLowerCase()==="input"&&(g.type==="checkbox"||g.type==="radio")&&(b=_g);if(b&&(b=b(e,l))){tp(m,b,t,f);break e}y&&y(e,g,l),e==="focusout"&&(y=g._wrapperState)&&y.controlled&&g.type==="number"&&Ii(g,"number",g.value)}switch(y=l?fr(l):window,e){case"focusin":(I0(y)||y.contentEditable==="true")&&(dr=y,$i=l,co=null);break;case"focusout":co=$i=dr=null;break;case"mousedown":Wi=!0;break;case"contextmenu":case"mouseup":case"dragend":Wi=!1,z0(m,t,f);break;case"selectionchange":if(Ag)break;case"keydown":case"keyup":z0(m,t,f)}var k;if(Rs)e:{switch(e){case"compositionstart":var _="onCompositionStart";break e;case"compositionend":_="onCompositionEnd";break e;case"compositionupdate":_="onCompositionUpdate";break e}_=void 0}else cr?ep(e,t)&&(_="onCompositionEnd"):e==="keydown"&&t.keyCode===229&&(_="onCompositionStart");_&&(Jd&&t.locale!=="ko"&&(cr||_!=="onCompositionStart"?_==="onCompositionEnd"&&cr&&(k=Kd()):(pt=f,Ds="value"in pt?pt.value:pt.textContent,cr=!0)),y=Ou(l,_),0<y.length&&(_=new D0(_,e,null,t,f),m.push({event:_,listeners:y}),k?_.data=k:(k=np(t),k!==null&&(_.data=k)))),(k=gg?xg(e,t):vg(e,t))&&(l=Ou(l,"onBeforeInput"),0<l.length&&(f=new D0("onBeforeInput","beforeinput",null,t,f),m.push({event:f,listeners:l}),f.data=k))}fp(m,n)})}function So(e,n,t){return{instance:e,listener:n,currentTarget:t}}function Ou(e,n){for(var t=n+"Capture",r=[];e!==null;){var o=e,u=o.stateNode;o.tag===5&&u!==null&&(o=u,u=vo(e,t),u!=null&&r.unshift(So(e,u,o)),u=vo(e,n),u!=null&&r.push(So(e,u,o))),e=e.return}return r}function ir(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function q0(e,n,t,r,o){for(var u=n._reactName,a=[];t!==null&&t!==r;){var i=t,s=i.alternate,l=i.stateNode;if(s!==null&&s===r)break;i.tag===5&&l!==null&&(i=l,o?(s=vo(t,u),s!=null&&a.unshift(So(t,s,i))):o||(s=vo(t,u),s!=null&&a.push(So(t,s,i)))),t=t.return}a.length!==0&&e.push({event:n,listeners:a})}var Fg=/\r\n?/g,Ng=/\u0000|\uFFFD/g;function H0(e){return(typeof e=="string"?e:""+e).replace(Fg,`
`).replace(Ng,"")}function hu(e,n,t){if(n=H0(n),H0(e)!==n&&t)throw Error(E(425))}function Bu(){}var Qi=null,Zi=null;function Gi(e,n){return e==="textarea"||e==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Xi=typeof setTimeout=="function"?setTimeout:void 0,Rg=typeof clearTimeout=="function"?clearTimeout:void 0,V0=typeof Promise=="function"?Promise:void 0,Ig=typeof queueMicrotask=="function"?queueMicrotask:typeof V0<"u"?function(e){return V0.resolve(null).then(e).catch(Mg)}:Xi;function Mg(e){setTimeout(function(){throw e})}function gi(e,n){var t=n,r=0;do{var o=t.nextSibling;if(e.removeChild(t),o&&o.nodeType===8)if(t=o.data,t==="/$"){if(r===0){e.removeChild(o),wo(n);return}r--}else t!=="$"&&t!=="$?"&&t!=="$!"||r++;t=o}while(t);wo(n)}function xt(e){for(;e!=null;e=e.nextSibling){var n=e.nodeType;if(n===1||n===3)break;if(n===8){if(n=e.data,n==="$"||n==="$!"||n==="$?")break;if(n==="/$")return null}}return e}function $0(e){e=e.previousSibling;for(var n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="$"||t==="$!"||t==="$?"){if(n===0)return e;n--}else t==="/$"&&n++}e=e.previousSibling}return null}var Mr=Math.random().toString(36).slice(2),Tn="__reactFiber$"+Mr,Eo="__reactProps$"+Mr,Gn="__reactContainer$"+Mr,Yi="__reactEvents$"+Mr,Pg="__reactListeners$"+Mr,Lg="__reactHandles$"+Mr;function Lt(e){var n=e[Tn];if(n)return n;for(var t=e.parentNode;t;){if(n=t[Gn]||t[Tn]){if(t=n.alternate,n.child!==null||t!==null&&t.child!==null)for(e=$0(e);e!==null;){if(t=e[Tn])return t;e=$0(e)}return n}e=t,t=e.parentNode}return null}function Po(e){return e=e[Tn]||e[Gn],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function fr(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(E(33))}function ua(e){return e[Eo]||null}var Ki=[],mr=-1;function St(e){return{current:e}}function J(e){0>mr||(e.current=Ki[mr],Ki[mr]=null,mr--)}function Y(e,n){mr++,Ki[mr]=e.current,e.current=n}var Ct={},De=St(Ct),qe=St(!1),jt=Ct;function Tr(e,n){var t=e.type.contextTypes;if(!t)return Ct;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===n)return r.__reactInternalMemoizedMaskedChildContext;var o={},u;for(u in t)o[u]=n[u];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=n,e.__reactInternalMemoizedMaskedChildContext=o),o}function He(e){return e=e.childContextTypes,e!=null}function Uu(){J(qe),J(De)}function W0(e,n,t){if(De.current!==Ct)throw Error(E(168));Y(De,n),Y(qe,t)}function hp(e,n,t){var r=e.stateNode;if(n=n.childContextTypes,typeof r.getChildContext!="function")return t;r=r.getChildContext();for(var o in r)if(!(o in n))throw Error(E(108,kh(e)||"Unknown",o));return re({},t,r)}function ju(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Ct,jt=De.current,Y(De,e),Y(qe,qe.current),!0}function Q0(e,n,t){var r=e.stateNode;if(!r)throw Error(E(169));t?(e=hp(e,n,jt),r.__reactInternalMemoizedMergedChildContext=e,J(qe),J(De),Y(De,e)):J(qe),Y(qe,t)}var Vn=null,aa=!1,xi=!1;function gp(e){Vn===null?Vn=[e]:Vn.push(e)}function zg(e){aa=!0,gp(e)}function Et(){if(!xi&&Vn!==null){xi=!0;var e=0,n=Q;try{var t=Vn;for(Q=1;e<t.length;e++){var r=t[e];do r=r(!0);while(r!==null)}Vn=null,aa=!1}catch(o){throw Vn!==null&&(Vn=Vn.slice(e+1)),jd(Ss,Et),o}finally{Q=n,xi=!1}}return null}var hr=[],gr=0,qu=null,Hu=0,on=[],un=0,qt=null,$n=1,Wn="";function Mt(e,n){hr[gr++]=Hu,hr[gr++]=qu,qu=e,Hu=n}function xp(e,n,t){on[un++]=$n,on[un++]=Wn,on[un++]=qt,qt=e;var r=$n;e=Wn;var o=32-vn(r)-1;r&=~(1<<o),t+=1;var u=32-vn(n)+o;if(30<u){var a=o-o%5;u=(r&(1<<a)-1).toString(32),r>>=a,o-=a,$n=1<<32-vn(n)+o|t<<o|r,Wn=u+e}else $n=1<<u|t<<o|r,Wn=e}function Ms(e){e.return!==null&&(Mt(e,1),xp(e,1,0))}function Ps(e){for(;e===qu;)qu=hr[--gr],hr[gr]=null,Hu=hr[--gr],hr[gr]=null;for(;e===qt;)qt=on[--un],on[un]=null,Wn=on[--un],on[un]=null,$n=on[--un],on[un]=null}var Ge=null,Ze=null,ee=!1,xn=null;function vp(e,n){var t=an(5,null,null,0);t.elementType="DELETED",t.stateNode=n,t.return=e,n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)}function Z0(e,n){switch(e.tag){case 5:var t=e.type;return n=n.nodeType!==1||t.toLowerCase()!==n.nodeName.toLowerCase()?null:n,n!==null?(e.stateNode=n,Ge=e,Ze=xt(n.firstChild),!0):!1;case 6:return n=e.pendingProps===""||n.nodeType!==3?null:n,n!==null?(e.stateNode=n,Ge=e,Ze=null,!0):!1;case 13:return n=n.nodeType!==8?null:n,n!==null?(t=qt!==null?{id:$n,overflow:Wn}:null,e.memoizedState={dehydrated:n,treeContext:t,retryLane:1073741824},t=an(18,null,null,0),t.stateNode=n,t.return=e,e.child=t,Ge=e,Ze=null,!0):!1;default:return!1}}function Ji(e){return(e.mode&1)!==0&&(e.flags&128)===0}function es(e){if(ee){var n=Ze;if(n){var t=n;if(!Z0(e,n)){if(Ji(e))throw Error(E(418));n=xt(t.nextSibling);var r=Ge;n&&Z0(e,n)?vp(r,t):(e.flags=e.flags&-4097|2,ee=!1,Ge=e)}}else{if(Ji(e))throw Error(E(418));e.flags=e.flags&-4097|2,ee=!1,Ge=e}}}function G0(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;Ge=e}function gu(e){if(e!==Ge)return!1;if(!ee)return G0(e),ee=!0,!1;var n;if((n=e.tag!==3)&&!(n=e.tag!==5)&&(n=e.type,n=n!=="head"&&n!=="body"&&!Gi(e.type,e.memoizedProps)),n&&(n=Ze)){if(Ji(e))throw bp(),Error(E(418));for(;n;)vp(e,n),n=xt(n.nextSibling)}if(G0(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(E(317));e:{for(e=e.nextSibling,n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="/$"){if(n===0){Ze=xt(e.nextSibling);break e}n--}else t!=="$"&&t!=="$!"&&t!=="$?"||n++}e=e.nextSibling}Ze=null}}else Ze=Ge?xt(e.stateNode.nextSibling):null;return!0}function bp(){for(var e=Ze;e;)e=xt(e.nextSibling)}function Ar(){Ze=Ge=null,ee=!1}function Ls(e){xn===null?xn=[e]:xn.push(e)}var Og=Kn.ReactCurrentBatchConfig;function Kr(e,n,t){if(e=t.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(t._owner){if(t=t._owner,t){if(t.tag!==1)throw Error(E(309));var r=t.stateNode}if(!r)throw Error(E(147,e));var o=r,u=""+e;return n!==null&&n.ref!==null&&typeof n.ref=="function"&&n.ref._stringRef===u?n.ref:(n=function(a){var i=o.refs;a===null?delete i[u]:i[u]=a},n._stringRef=u,n)}if(typeof e!="string")throw Error(E(284));if(!t._owner)throw Error(E(290,e))}return e}function xu(e,n){throw e=Object.prototype.toString.call(n),Error(E(31,e==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":e))}function X0(e){var n=e._init;return n(e._payload)}function yp(e){function n(h,d){if(e){var c=h.deletions;c===null?(h.deletions=[d],h.flags|=16):c.push(d)}}function t(h,d){if(!e)return null;for(;d!==null;)n(h,d),d=d.sibling;return null}function r(h,d){for(h=new Map;d!==null;)d.key!==null?h.set(d.key,d):h.set(d.index,d),d=d.sibling;return h}function o(h,d){return h=wt(h,d),h.index=0,h.sibling=null,h}function u(h,d,c){return h.index=c,e?(c=h.alternate,c!==null?(c=c.index,c<d?(h.flags|=2,d):c):(h.flags|=2,d)):(h.flags|=1048576,d)}function a(h){return e&&h.alternate===null&&(h.flags|=2),h}function i(h,d,c,p){return d===null||d.tag!==6?(d=_i(c,h.mode,p),d.return=h,d):(d=o(d,c),d.return=h,d)}function s(h,d,c,p){var b=c.type;return b===lr?f(h,d,c.props.children,p,c.key):d!==null&&(d.elementType===b||typeof b=="object"&&b!==null&&b.$$typeof===st&&X0(b)===d.type)?(p=o(d,c.props),p.ref=Kr(h,d,c),p.return=h,p):(p=Fu(c.type,c.key,c.props,null,h.mode,p),p.ref=Kr(h,d,c),p.return=h,p)}function l(h,d,c,p){return d===null||d.tag!==4||d.stateNode.containerInfo!==c.containerInfo||d.stateNode.implementation!==c.implementation?(d=Si(c,h.mode,p),d.return=h,d):(d=o(d,c.children||[]),d.return=h,d)}function f(h,d,c,p,b){return d===null||d.tag!==7?(d=Ut(c,h.mode,p,b),d.return=h,d):(d=o(d,c),d.return=h,d)}function m(h,d,c){if(typeof d=="string"&&d!==""||typeof d=="number")return d=_i(""+d,h.mode,c),d.return=h,d;if(typeof d=="object"&&d!==null){switch(d.$$typeof){case tu:return c=Fu(d.type,d.key,d.props,null,h.mode,c),c.ref=Kr(h,null,d),c.return=h,c;case sr:return d=Si(d,h.mode,c),d.return=h,d;case st:var p=d._init;return m(h,p(d._payload),c)}if(ro(d)||Zr(d))return d=Ut(d,h.mode,c,null),d.return=h,d;xu(h,d)}return null}function g(h,d,c,p){var b=d!==null?d.key:null;if(typeof c=="string"&&c!==""||typeof c=="number")return b!==null?null:i(h,d,""+c,p);if(typeof c=="object"&&c!==null){switch(c.$$typeof){case tu:return c.key===b?s(h,d,c,p):null;case sr:return c.key===b?l(h,d,c,p):null;case st:return b=c._init,g(h,d,b(c._payload),p)}if(ro(c)||Zr(c))return b!==null?null:f(h,d,c,p,null);xu(h,c)}return null}function v(h,d,c,p,b){if(typeof p=="string"&&p!==""||typeof p=="number")return h=h.get(c)||null,i(d,h,""+p,b);if(typeof p=="object"&&p!==null){switch(p.$$typeof){case tu:return h=h.get(p.key===null?c:p.key)||null,s(d,h,p,b);case sr:return h=h.get(p.key===null?c:p.key)||null,l(d,h,p,b);case st:var y=p._init;return v(h,d,c,y(p._payload),b)}if(ro(p)||Zr(p))return h=h.get(c)||null,f(d,h,p,b,null);xu(d,p)}return null}function x(h,d,c,p){for(var b=null,y=null,k=d,_=d=0,T=null;k!==null&&_<c.length;_++){k.index>_?(T=k,k=null):T=k.sibling;var S=g(h,k,c[_],p);if(S===null){k===null&&(k=T);break}e&&k&&S.alternate===null&&n(h,k),d=u(S,d,_),y===null?b=S:y.sibling=S,y=S,k=T}if(_===c.length)return t(h,k),ee&&Mt(h,_),b;if(k===null){for(;_<c.length;_++)k=m(h,c[_],p),k!==null&&(d=u(k,d,_),y===null?b=k:y.sibling=k,y=k);return ee&&Mt(h,_),b}for(k=r(h,k);_<c.length;_++)T=v(k,h,_,c[_],p),T!==null&&(e&&T.alternate!==null&&k.delete(T.key===null?_:T.key),d=u(T,d,_),y===null?b=T:y.sibling=T,y=T);return e&&k.forEach(function(N){return n(h,N)}),ee&&Mt(h,_),b}function w(h,d,c,p){var b=Zr(c);if(typeof b!="function")throw Error(E(150));if(c=b.call(c),c==null)throw Error(E(151));for(var y=b=null,k=d,_=d=0,T=null,S=c.next();k!==null&&!S.done;_++,S=c.next()){k.index>_?(T=k,k=null):T=k.sibling;var N=g(h,k,S.value,p);if(N===null){k===null&&(k=T);break}e&&k&&N.alternate===null&&n(h,k),d=u(N,d,_),y===null?b=N:y.sibling=N,y=N,k=T}if(S.done)return t(h,k),ee&&Mt(h,_),b;if(k===null){for(;!S.done;_++,S=c.next())S=m(h,S.value,p),S!==null&&(d=u(S,d,_),y===null?b=S:y.sibling=S,y=S);return ee&&Mt(h,_),b}for(k=r(h,k);!S.done;_++,S=c.next())S=v(k,h,_,S.value,p),S!==null&&(e&&S.alternate!==null&&k.delete(S.key===null?_:S.key),d=u(S,d,_),y===null?b=S:y.sibling=S,y=S);return e&&k.forEach(function(P){return n(h,P)}),ee&&Mt(h,_),b}function C(h,d,c,p){if(typeof c=="object"&&c!==null&&c.type===lr&&c.key===null&&(c=c.props.children),typeof c=="object"&&c!==null){switch(c.$$typeof){case tu:e:{for(var b=c.key,y=d;y!==null;){if(y.key===b){if(b=c.type,b===lr){if(y.tag===7){t(h,y.sibling),d=o(y,c.props.children),d.return=h,h=d;break e}}else if(y.elementType===b||typeof b=="object"&&b!==null&&b.$$typeof===st&&X0(b)===y.type){t(h,y.sibling),d=o(y,c.props),d.ref=Kr(h,y,c),d.return=h,h=d;break e}t(h,y);break}else n(h,y);y=y.sibling}c.type===lr?(d=Ut(c.props.children,h.mode,p,c.key),d.return=h,h=d):(p=Fu(c.type,c.key,c.props,null,h.mode,p),p.ref=Kr(h,d,c),p.return=h,h=p)}return a(h);case sr:e:{for(y=c.key;d!==null;){if(d.key===y)if(d.tag===4&&d.stateNode.containerInfo===c.containerInfo&&d.stateNode.implementation===c.implementation){t(h,d.sibling),d=o(d,c.children||[]),d.return=h,h=d;break e}else{t(h,d);break}else n(h,d);d=d.sibling}d=Si(c,h.mode,p),d.return=h,h=d}return a(h);case st:return y=c._init,C(h,d,y(c._payload),p)}if(ro(c))return x(h,d,c,p);if(Zr(c))return w(h,d,c,p);xu(h,c)}return typeof c=="string"&&c!==""||typeof c=="number"?(c=""+c,d!==null&&d.tag===6?(t(h,d.sibling),d=o(d,c),d.return=h,h=d):(t(h,d),d=_i(c,h.mode,p),d.return=h,h=d),a(h)):t(h,d)}return C}var Dr=yp(!0),wp=yp(!1),Vu=St(null),$u=null,xr=null,zs=null;function Os(){zs=xr=$u=null}function Bs(e){var n=Vu.current;J(Vu),e._currentValue=n}function ns(e,n,t){for(;e!==null;){var r=e.alternate;if((e.childLanes&n)!==n?(e.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),e===t)break;e=e.return}}function _r(e,n){$u=e,zs=xr=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&n)!==0&&(je=!0),e.firstContext=null)}function ln(e){var n=e._currentValue;if(zs!==e)if(e={context:e,memoizedValue:n,next:null},xr===null){if($u===null)throw Error(E(308));xr=e,$u.dependencies={lanes:0,firstContext:e}}else xr=xr.next=e;return n}var zt=null;function Us(e){zt===null?zt=[e]:zt.push(e)}function kp(e,n,t,r){var o=n.interleaved;return o===null?(t.next=t,Us(n)):(t.next=o.next,o.next=t),n.interleaved=t,Xn(e,r)}function Xn(e,n){e.lanes|=n;var t=e.alternate;for(t!==null&&(t.lanes|=n),t=e,e=e.return;e!==null;)e.childLanes|=n,t=e.alternate,t!==null&&(t.childLanes|=n),t=e,e=e.return;return t.tag===3?t.stateNode:null}var lt=!1;function js(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Cp(e,n){e=e.updateQueue,n.updateQueue===e&&(n.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Qn(e,n){return{eventTime:e,lane:n,tag:0,payload:null,callback:null,next:null}}function vt(e,n,t){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,(V&2)!==0){var o=r.pending;return o===null?n.next=n:(n.next=o.next,o.next=n),r.pending=n,Xn(e,t)}return o=r.interleaved,o===null?(n.next=n,Us(r)):(n.next=o.next,o.next=n),r.interleaved=n,Xn(e,t)}function _u(e,n,t){if(n=n.updateQueue,n!==null&&(n=n.shared,(t&4194240)!==0)){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,Es(e,t)}}function Y0(e,n){var t=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,t===r)){var o=null,u=null;if(t=t.firstBaseUpdate,t!==null){do{var a={eventTime:t.eventTime,lane:t.lane,tag:t.tag,payload:t.payload,callback:t.callback,next:null};u===null?o=u=a:u=u.next=a,t=t.next}while(t!==null);u===null?o=u=n:u=u.next=n}else o=u=n;t={baseState:r.baseState,firstBaseUpdate:o,lastBaseUpdate:u,shared:r.shared,effects:r.effects},e.updateQueue=t;return}e=t.lastBaseUpdate,e===null?t.firstBaseUpdate=n:e.next=n,t.lastBaseUpdate=n}function Wu(e,n,t,r){var o=e.updateQueue;lt=!1;var u=o.firstBaseUpdate,a=o.lastBaseUpdate,i=o.shared.pending;if(i!==null){o.shared.pending=null;var s=i,l=s.next;s.next=null,a===null?u=l:a.next=l,a=s;var f=e.alternate;f!==null&&(f=f.updateQueue,i=f.lastBaseUpdate,i!==a&&(i===null?f.firstBaseUpdate=l:i.next=l,f.lastBaseUpdate=s))}if(u!==null){var m=o.baseState;a=0,f=l=s=null,i=u;do{var g=i.lane,v=i.eventTime;if((r&g)===g){f!==null&&(f=f.next={eventTime:v,lane:0,tag:i.tag,payload:i.payload,callback:i.callback,next:null});e:{var x=e,w=i;switch(g=n,v=t,w.tag){case 1:if(x=w.payload,typeof x=="function"){m=x.call(v,m,g);break e}m=x;break e;case 3:x.flags=x.flags&-65537|128;case 0:if(x=w.payload,g=typeof x=="function"?x.call(v,m,g):x,g==null)break e;m=re({},m,g);break e;case 2:lt=!0}}i.callback!==null&&i.lane!==0&&(e.flags|=64,g=o.effects,g===null?o.effects=[i]:g.push(i))}else v={eventTime:v,lane:g,tag:i.tag,payload:i.payload,callback:i.callback,next:null},f===null?(l=f=v,s=m):f=f.next=v,a|=g;if(i=i.next,i===null){if(i=o.shared.pending,i===null)break;g=i,i=g.next,g.next=null,o.lastBaseUpdate=g,o.shared.pending=null}}while(!0);if(f===null&&(s=m),o.baseState=s,o.firstBaseUpdate=l,o.lastBaseUpdate=f,n=o.shared.interleaved,n!==null){o=n;do a|=o.lane,o=o.next;while(o!==n)}else u===null&&(o.shared.lanes=0);Vt|=a,e.lanes=a,e.memoizedState=m}}function K0(e,n,t){if(e=n.effects,n.effects=null,e!==null)for(n=0;n<e.length;n++){var r=e[n],o=r.callback;if(o!==null){if(r.callback=null,r=t,typeof o!="function")throw Error(E(191,o));o.call(r)}}}var Lo={},Dn=St(Lo),To=St(Lo),Ao=St(Lo);function Ot(e){if(e===Lo)throw Error(E(174));return e}function qs(e,n){switch(Y(Ao,n),Y(To,e),Y(Dn,Lo),e=n.nodeType,e){case 9:case 11:n=(n=n.documentElement)?n.namespaceURI:Pi(null,"");break;default:e=e===8?n.parentNode:n,n=e.namespaceURI||null,e=e.tagName,n=Pi(n,e)}J(Dn),Y(Dn,n)}function Fr(){J(Dn),J(To),J(Ao)}function _p(e){Ot(Ao.current);var n=Ot(Dn.current),t=Pi(n,e.type);n!==t&&(Y(To,e),Y(Dn,t))}function Hs(e){To.current===e&&(J(Dn),J(To))}var ne=St(0);function Qu(e){for(var n=e;n!==null;){if(n.tag===13){var t=n.memoizedState;if(t!==null&&(t=t.dehydrated,t===null||t.data==="$?"||t.data==="$!"))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!==void 0){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var vi=[];function Vs(){for(var e=0;e<vi.length;e++)vi[e]._workInProgressVersionPrimary=null;vi.length=0}var Su=Kn.ReactCurrentDispatcher,bi=Kn.ReactCurrentBatchConfig,Ht=0,te=null,se=null,fe=null,Zu=!1,po=!1,Do=0,Bg=0;function Ee(){throw Error(E(321))}function $s(e,n){if(n===null)return!1;for(var t=0;t<n.length&&t<e.length;t++)if(!yn(e[t],n[t]))return!1;return!0}function Ws(e,n,t,r,o,u){if(Ht=u,te=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Su.current=e===null||e.memoizedState===null?Hg:Vg,e=t(r,o),po){u=0;do{if(po=!1,Do=0,25<=u)throw Error(E(301));u+=1,fe=se=null,n.updateQueue=null,Su.current=$g,e=t(r,o)}while(po)}if(Su.current=Gu,n=se!==null&&se.next!==null,Ht=0,fe=se=te=null,Zu=!1,n)throw Error(E(300));return e}function Qs(){var e=Do!==0;return Do=0,e}function En(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return fe===null?te.memoizedState=fe=e:fe=fe.next=e,fe}function cn(){if(se===null){var e=te.alternate;e=e!==null?e.memoizedState:null}else e=se.next;var n=fe===null?te.memoizedState:fe.next;if(n!==null)fe=n,se=e;else{if(e===null)throw Error(E(310));se=e,e={memoizedState:se.memoizedState,baseState:se.baseState,baseQueue:se.baseQueue,queue:se.queue,next:null},fe===null?te.memoizedState=fe=e:fe=fe.next=e}return fe}function Fo(e,n){return typeof n=="function"?n(e):n}function yi(e){var n=cn(),t=n.queue;if(t===null)throw Error(E(311));t.lastRenderedReducer=e;var r=se,o=r.baseQueue,u=t.pending;if(u!==null){if(o!==null){var a=o.next;o.next=u.next,u.next=a}r.baseQueue=o=u,t.pending=null}if(o!==null){u=o.next,r=r.baseState;var i=a=null,s=null,l=u;do{var f=l.lane;if((Ht&f)===f)s!==null&&(s=s.next={lane:0,action:l.action,hasEagerState:l.hasEagerState,eagerState:l.eagerState,next:null}),r=l.hasEagerState?l.eagerState:e(r,l.action);else{var m={lane:f,action:l.action,hasEagerState:l.hasEagerState,eagerState:l.eagerState,next:null};s===null?(i=s=m,a=r):s=s.next=m,te.lanes|=f,Vt|=f}l=l.next}while(l!==null&&l!==u);s===null?a=r:s.next=i,yn(r,n.memoizedState)||(je=!0),n.memoizedState=r,n.baseState=a,n.baseQueue=s,t.lastRenderedState=r}if(e=t.interleaved,e!==null){o=e;do u=o.lane,te.lanes|=u,Vt|=u,o=o.next;while(o!==e)}else o===null&&(t.lanes=0);return[n.memoizedState,t.dispatch]}function wi(e){var n=cn(),t=n.queue;if(t===null)throw Error(E(311));t.lastRenderedReducer=e;var r=t.dispatch,o=t.pending,u=n.memoizedState;if(o!==null){t.pending=null;var a=o=o.next;do u=e(u,a.action),a=a.next;while(a!==o);yn(u,n.memoizedState)||(je=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),t.lastRenderedState=u}return[u,r]}function Sp(){}function Ep(e,n){var t=te,r=cn(),o=n(),u=!yn(r.memoizedState,o);if(u&&(r.memoizedState=o,je=!0),r=r.queue,Zs(Dp.bind(null,t,r,e),[e]),r.getSnapshot!==n||u||fe!==null&&fe.memoizedState.tag&1){if(t.flags|=2048,No(9,Ap.bind(null,t,r,o,n),void 0,null),me===null)throw Error(E(349));(Ht&30)!==0||Tp(t,n,o)}return o}function Tp(e,n,t){e.flags|=16384,e={getSnapshot:n,value:t},n=te.updateQueue,n===null?(n={lastEffect:null,stores:null},te.updateQueue=n,n.stores=[e]):(t=n.stores,t===null?n.stores=[e]:t.push(e))}function Ap(e,n,t,r){n.value=t,n.getSnapshot=r,Fp(n)&&Np(e)}function Dp(e,n,t){return t(function(){Fp(n)&&Np(e)})}function Fp(e){var n=e.getSnapshot;e=e.value;try{var t=n();return!yn(e,t)}catch{return!0}}function Np(e){var n=Xn(e,1);n!==null&&bn(n,e,1,-1)}function J0(e){var n=En();return typeof e=="function"&&(e=e()),n.memoizedState=n.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Fo,lastRenderedState:e},n.queue=e,e=e.dispatch=qg.bind(null,te,e),[n.memoizedState,e]}function No(e,n,t,r){return e={tag:e,create:n,destroy:t,deps:r,next:null},n=te.updateQueue,n===null?(n={lastEffect:null,stores:null},te.updateQueue=n,n.lastEffect=e.next=e):(t=n.lastEffect,t===null?n.lastEffect=e.next=e:(r=t.next,t.next=e,e.next=r,n.lastEffect=e)),e}function Rp(){return cn().memoizedState}function Eu(e,n,t,r){var o=En();te.flags|=e,o.memoizedState=No(1|n,t,void 0,r===void 0?null:r)}function ia(e,n,t,r){var o=cn();r=r===void 0?null:r;var u=void 0;if(se!==null){var a=se.memoizedState;if(u=a.destroy,r!==null&&$s(r,a.deps)){o.memoizedState=No(n,t,u,r);return}}te.flags|=e,o.memoizedState=No(1|n,t,u,r)}function ed(e,n){return Eu(8390656,8,e,n)}function Zs(e,n){return ia(2048,8,e,n)}function Ip(e,n){return ia(4,2,e,n)}function Mp(e,n){return ia(4,4,e,n)}function Pp(e,n){if(typeof n=="function")return e=e(),n(e),function(){n(null)};if(n!=null)return e=e(),n.current=e,function(){n.current=null}}function Lp(e,n,t){return t=t!=null?t.concat([e]):null,ia(4,4,Pp.bind(null,n,e),t)}function Gs(){}function zp(e,n){var t=cn();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&$s(n,r[1])?r[0]:(t.memoizedState=[e,n],e)}function Op(e,n){var t=cn();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&$s(n,r[1])?r[0]:(e=e(),t.memoizedState=[e,n],e)}function Bp(e,n,t){return(Ht&21)===0?(e.baseState&&(e.baseState=!1,je=!0),e.memoizedState=t):(yn(t,n)||(t=Vd(),te.lanes|=t,Vt|=t,e.baseState=!0),n)}function Ug(e,n){var t=Q;Q=t!==0&&4>t?t:4,e(!0);var r=bi.transition;bi.transition={};try{e(!1),n()}finally{Q=t,bi.transition=r}}function Up(){return cn().memoizedState}function jg(e,n,t){var r=yt(e);if(t={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null},jp(e))qp(n,t);else if(t=kp(e,n,t,r),t!==null){var o=Ie();bn(t,e,r,o),Hp(t,n,r)}}function qg(e,n,t){var r=yt(e),o={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null};if(jp(e))qp(n,o);else{var u=e.alternate;if(e.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var a=n.lastRenderedState,i=u(a,t);if(o.hasEagerState=!0,o.eagerState=i,yn(i,a)){var s=n.interleaved;s===null?(o.next=o,Us(n)):(o.next=s.next,s.next=o),n.interleaved=o;return}}catch{}finally{}t=kp(e,n,o,r),t!==null&&(o=Ie(),bn(t,e,r,o),Hp(t,n,r))}}function jp(e){var n=e.alternate;return e===te||n!==null&&n===te}function qp(e,n){po=Zu=!0;var t=e.pending;t===null?n.next=n:(n.next=t.next,t.next=n),e.pending=n}function Hp(e,n,t){if((t&4194240)!==0){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,Es(e,t)}}var Gu={readContext:ln,useCallback:Ee,useContext:Ee,useEffect:Ee,useImperativeHandle:Ee,useInsertionEffect:Ee,useLayoutEffect:Ee,useMemo:Ee,useReducer:Ee,useRef:Ee,useState:Ee,useDebugValue:Ee,useDeferredValue:Ee,useTransition:Ee,useMutableSource:Ee,useSyncExternalStore:Ee,useId:Ee,unstable_isNewReconciler:!1},Hg={readContext:ln,useCallback:function(e,n){return En().memoizedState=[e,n===void 0?null:n],e},useContext:ln,useEffect:ed,useImperativeHandle:function(e,n,t){return t=t!=null?t.concat([e]):null,Eu(4194308,4,Pp.bind(null,n,e),t)},useLayoutEffect:function(e,n){return Eu(4194308,4,e,n)},useInsertionEffect:function(e,n){return Eu(4,2,e,n)},useMemo:function(e,n){var t=En();return n=n===void 0?null:n,e=e(),t.memoizedState=[e,n],e},useReducer:function(e,n,t){var r=En();return n=t!==void 0?t(n):n,r.memoizedState=r.baseState=n,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},r.queue=e,e=e.dispatch=jg.bind(null,te,e),[r.memoizedState,e]},useRef:function(e){var n=En();return e={current:e},n.memoizedState=e},useState:J0,useDebugValue:Gs,useDeferredValue:function(e){return En().memoizedState=e},useTransition:function(){var e=J0(!1),n=e[0];return e=Ug.bind(null,e[1]),En().memoizedState=e,[n,e]},useMutableSource:function(){},useSyncExternalStore:function(e,n,t){var r=te,o=En();if(ee){if(t===void 0)throw Error(E(407));t=t()}else{if(t=n(),me===null)throw Error(E(349));(Ht&30)!==0||Tp(r,n,t)}o.memoizedState=t;var u={value:t,getSnapshot:n};return o.queue=u,ed(Dp.bind(null,r,u,e),[e]),r.flags|=2048,No(9,Ap.bind(null,r,u,t,n),void 0,null),t},useId:function(){var e=En(),n=me.identifierPrefix;if(ee){var t=Wn,r=$n;t=(r&~(1<<32-vn(r)-1)).toString(32)+t,n=":"+n+"R"+t,t=Do++,0<t&&(n+="H"+t.toString(32)),n+=":"}else t=Bg++,n=":"+n+"r"+t.toString(32)+":";return e.memoizedState=n},unstable_isNewReconciler:!1},Vg={readContext:ln,useCallback:zp,useContext:ln,useEffect:Zs,useImperativeHandle:Lp,useInsertionEffect:Ip,useLayoutEffect:Mp,useMemo:Op,useReducer:yi,useRef:Rp,useState:function(){return yi(Fo)},useDebugValue:Gs,useDeferredValue:function(e){var n=cn();return Bp(n,se.memoizedState,e)},useTransition:function(){var e=yi(Fo)[0],n=cn().memoizedState;return[e,n]},useMutableSource:Sp,useSyncExternalStore:Ep,useId:Up,unstable_isNewReconciler:!1},$g={readContext:ln,useCallback:zp,useContext:ln,useEffect:Zs,useImperativeHandle:Lp,useInsertionEffect:Ip,useLayoutEffect:Mp,useMemo:Op,useReducer:wi,useRef:Rp,useState:function(){return wi(Fo)},useDebugValue:Gs,useDeferredValue:function(e){var n=cn();return se===null?n.memoizedState=e:Bp(n,se.memoizedState,e)},useTransition:function(){var e=wi(Fo)[0],n=cn().memoizedState;return[e,n]},useMutableSource:Sp,useSyncExternalStore:Ep,useId:Up,unstable_isNewReconciler:!1};function hn(e,n){if(e&&e.defaultProps){n=re({},n),e=e.defaultProps;for(var t in e)n[t]===void 0&&(n[t]=e[t]);return n}return n}function ts(e,n,t,r){n=e.memoizedState,t=t(r,n),t=t==null?n:re({},n,t),e.memoizedState=t,e.lanes===0&&(e.updateQueue.baseState=t)}var sa={isMounted:function(e){return(e=e._reactInternals)?Qt(e)===e:!1},enqueueSetState:function(e,n,t){e=e._reactInternals;var r=Ie(),o=yt(e),u=Qn(r,o);u.payload=n,t!=null&&(u.callback=t),n=vt(e,u,o),n!==null&&(bn(n,e,o,r),_u(n,e,o))},enqueueReplaceState:function(e,n,t){e=e._reactInternals;var r=Ie(),o=yt(e),u=Qn(r,o);u.tag=1,u.payload=n,t!=null&&(u.callback=t),n=vt(e,u,o),n!==null&&(bn(n,e,o,r),_u(n,e,o))},enqueueForceUpdate:function(e,n){e=e._reactInternals;var t=Ie(),r=yt(e),o=Qn(t,r);o.tag=2,n!=null&&(o.callback=n),n=vt(e,o,r),n!==null&&(bn(n,e,r,t),_u(n,e,r))}};function nd(e,n,t,r,o,u,a){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,u,a):n.prototype&&n.prototype.isPureReactComponent?!Co(t,r)||!Co(o,u):!0}function Vp(e,n,t){var r=!1,o=Ct,u=n.contextType;return typeof u=="object"&&u!==null?u=ln(u):(o=He(n)?jt:De.current,r=n.contextTypes,u=(r=r!=null)?Tr(e,o):Ct),n=new n(t,u),e.memoizedState=n.state!==null&&n.state!==void 0?n.state:null,n.updater=sa,e.stateNode=n,n._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=o,e.__reactInternalMemoizedMaskedChildContext=u),n}function td(e,n,t,r){e=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(t,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(t,r),n.state!==e&&sa.enqueueReplaceState(n,n.state,null)}function rs(e,n,t,r){var o=e.stateNode;o.props=t,o.state=e.memoizedState,o.refs={},js(e);var u=n.contextType;typeof u=="object"&&u!==null?o.context=ln(u):(u=He(n)?jt:De.current,o.context=Tr(e,u)),o.state=e.memoizedState,u=n.getDerivedStateFromProps,typeof u=="function"&&(ts(e,n,u,t),o.state=e.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof o.getSnapshotBeforeUpdate=="function"||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(n=o.state,typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount(),n!==o.state&&sa.enqueueReplaceState(o,o.state,null),Wu(e,t,o,r),o.state=e.memoizedState),typeof o.componentDidMount=="function"&&(e.flags|=4194308)}function Nr(e,n){try{var t="",r=n;do t+=wh(r),r=r.return;while(r);var o=t}catch(u){o=`
Error generating stack: `+u.message+`
`+u.stack}return{value:e,source:n,stack:o,digest:null}}function ki(e,n,t){return{value:e,source:null,stack:t??null,digest:n??null}}function os(e,n){try{console.error(n.value)}catch(t){setTimeout(function(){throw t})}}var Wg=typeof WeakMap=="function"?WeakMap:Map;function $p(e,n,t){t=Qn(-1,t),t.tag=3,t.payload={element:null};var r=n.value;return t.callback=function(){Yu||(Yu=!0,ms=r),os(e,n)},t}function Wp(e,n,t){t=Qn(-1,t),t.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var o=n.value;t.payload=function(){return r(o)},t.callback=function(){os(e,n)}}var u=e.stateNode;return u!==null&&typeof u.componentDidCatch=="function"&&(t.callback=function(){os(e,n),typeof r!="function"&&(bt===null?bt=new Set([this]):bt.add(this));var a=n.stack;this.componentDidCatch(n.value,{componentStack:a!==null?a:""})}),t}function rd(e,n,t){var r=e.pingCache;if(r===null){r=e.pingCache=new Wg;var o=new Set;r.set(n,o)}else o=r.get(n),o===void 0&&(o=new Set,r.set(n,o));o.has(t)||(o.add(t),e=a2.bind(null,e,n,t),n.then(e,e))}function od(e){do{var n;if((n=e.tag===13)&&(n=e.memoizedState,n=n!==null?n.dehydrated!==null:!0),n)return e;e=e.return}while(e!==null);return null}function ud(e,n,t,r,o){return(e.mode&1)===0?(e===n?e.flags|=65536:(e.flags|=128,t.flags|=131072,t.flags&=-52805,t.tag===1&&(t.alternate===null?t.tag=17:(n=Qn(-1,1),n.tag=2,vt(t,n,1))),t.lanes|=1),e):(e.flags|=65536,e.lanes=o,e)}var Qg=Kn.ReactCurrentOwner,je=!1;function Re(e,n,t,r){n.child=e===null?wp(n,null,t,r):Dr(n,e.child,t,r)}function ad(e,n,t,r,o){t=t.render;var u=n.ref;return _r(n,o),r=Ws(e,n,t,r,u,o),t=Qs(),e!==null&&!je?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~o,Yn(e,n,o)):(ee&&t&&Ms(n),n.flags|=1,Re(e,n,r,o),n.child)}function id(e,n,t,r,o){if(e===null){var u=t.type;return typeof u=="function"&&!rl(u)&&u.defaultProps===void 0&&t.compare===null&&t.defaultProps===void 0?(n.tag=15,n.type=u,Qp(e,n,u,r,o)):(e=Fu(t.type,null,r,n,n.mode,o),e.ref=n.ref,e.return=n,n.child=e)}if(u=e.child,(e.lanes&o)===0){var a=u.memoizedProps;if(t=t.compare,t=t!==null?t:Co,t(a,r)&&e.ref===n.ref)return Yn(e,n,o)}return n.flags|=1,e=wt(u,r),e.ref=n.ref,e.return=n,n.child=e}function Qp(e,n,t,r,o){if(e!==null){var u=e.memoizedProps;if(Co(u,r)&&e.ref===n.ref)if(je=!1,n.pendingProps=r=u,(e.lanes&o)!==0)(e.flags&131072)!==0&&(je=!0);else return n.lanes=e.lanes,Yn(e,n,o)}return us(e,n,t,r,o)}function Zp(e,n,t){var r=n.pendingProps,o=r.children,u=e!==null?e.memoizedState:null;if(r.mode==="hidden")if((n.mode&1)===0)n.memoizedState={baseLanes:0,cachePool:null,transitions:null},Y(br,Qe),Qe|=t;else{if((t&1073741824)===0)return e=u!==null?u.baseLanes|t:t,n.lanes=n.childLanes=1073741824,n.memoizedState={baseLanes:e,cachePool:null,transitions:null},n.updateQueue=null,Y(br,Qe),Qe|=e,null;n.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=u!==null?u.baseLanes:t,Y(br,Qe),Qe|=r}else u!==null?(r=u.baseLanes|t,n.memoizedState=null):r=t,Y(br,Qe),Qe|=r;return Re(e,n,o,t),n.child}function Gp(e,n){var t=n.ref;(e===null&&t!==null||e!==null&&e.ref!==t)&&(n.flags|=512,n.flags|=2097152)}function us(e,n,t,r,o){var u=He(t)?jt:De.current;return u=Tr(n,u),_r(n,o),t=Ws(e,n,t,r,u,o),r=Qs(),e!==null&&!je?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~o,Yn(e,n,o)):(ee&&r&&Ms(n),n.flags|=1,Re(e,n,t,o),n.child)}function sd(e,n,t,r,o){if(He(t)){var u=!0;ju(n)}else u=!1;if(_r(n,o),n.stateNode===null)Tu(e,n),Vp(n,t,r),rs(n,t,r,o),r=!0;else if(e===null){var a=n.stateNode,i=n.memoizedProps;a.props=i;var s=a.context,l=t.contextType;typeof l=="object"&&l!==null?l=ln(l):(l=He(t)?jt:De.current,l=Tr(n,l));var f=t.getDerivedStateFromProps,m=typeof f=="function"||typeof a.getSnapshotBeforeUpdate=="function";m||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(i!==r||s!==l)&&td(n,a,r,l),lt=!1;var g=n.memoizedState;a.state=g,Wu(n,r,a,o),s=n.memoizedState,i!==r||g!==s||qe.current||lt?(typeof f=="function"&&(ts(n,t,f,r),s=n.memoizedState),(i=lt||nd(n,t,i,r,g,s,l))?(m||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(n.flags|=4194308)):(typeof a.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=s),a.props=r,a.state=s,a.context=l,r=i):(typeof a.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{a=n.stateNode,Cp(e,n),i=n.memoizedProps,l=n.type===n.elementType?i:hn(n.type,i),a.props=l,m=n.pendingProps,g=a.context,s=t.contextType,typeof s=="object"&&s!==null?s=ln(s):(s=He(t)?jt:De.current,s=Tr(n,s));var v=t.getDerivedStateFromProps;(f=typeof v=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(i!==m||g!==s)&&td(n,a,r,s),lt=!1,g=n.memoizedState,a.state=g,Wu(n,r,a,o);var x=n.memoizedState;i!==m||g!==x||qe.current||lt?(typeof v=="function"&&(ts(n,t,v,r),x=n.memoizedState),(l=lt||nd(n,t,l,r,g,x,s)||!1)?(f||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(r,x,s),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(r,x,s)),typeof a.componentDidUpdate=="function"&&(n.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof a.componentDidUpdate!="function"||i===e.memoizedProps&&g===e.memoizedState||(n.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||i===e.memoizedProps&&g===e.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=x),a.props=r,a.state=x,a.context=s,r=l):(typeof a.componentDidUpdate!="function"||i===e.memoizedProps&&g===e.memoizedState||(n.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||i===e.memoizedProps&&g===e.memoizedState||(n.flags|=1024),r=!1)}return as(e,n,t,r,u,o)}function as(e,n,t,r,o,u){Gp(e,n);var a=(n.flags&128)!==0;if(!r&&!a)return o&&Q0(n,t,!1),Yn(e,n,u);r=n.stateNode,Qg.current=n;var i=a&&typeof t.getDerivedStateFromError!="function"?null:r.render();return n.flags|=1,e!==null&&a?(n.child=Dr(n,e.child,null,u),n.child=Dr(n,null,i,u)):Re(e,n,i,u),n.memoizedState=r.state,o&&Q0(n,t,!0),n.child}function Xp(e){var n=e.stateNode;n.pendingContext?W0(e,n.pendingContext,n.pendingContext!==n.context):n.context&&W0(e,n.context,!1),qs(e,n.containerInfo)}function ld(e,n,t,r,o){return Ar(),Ls(o),n.flags|=256,Re(e,n,t,r),n.child}var is={dehydrated:null,treeContext:null,retryLane:0};function ss(e){return{baseLanes:e,cachePool:null,transitions:null}}function Yp(e,n,t){var r=n.pendingProps,o=ne.current,u=!1,a=(n.flags&128)!==0,i;if((i=a)||(i=e!==null&&e.memoizedState===null?!1:(o&2)!==0),i?(u=!0,n.flags&=-129):(e===null||e.memoizedState!==null)&&(o|=1),Y(ne,o&1),e===null)return es(n),e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((n.mode&1)===0?n.lanes=1:e.data==="$!"?n.lanes=8:n.lanes=1073741824,null):(a=r.children,e=r.fallback,u?(r=n.mode,u=n.child,a={mode:"hidden",children:a},(r&1)===0&&u!==null?(u.childLanes=0,u.pendingProps=a):u=da(a,r,0,null),e=Ut(e,r,t,null),u.return=n,e.return=n,u.sibling=e,n.child=u,n.child.memoizedState=ss(t),n.memoizedState=is,e):Xs(n,a));if(o=e.memoizedState,o!==null&&(i=o.dehydrated,i!==null))return Zg(e,n,a,r,i,o,t);if(u){u=r.fallback,a=n.mode,o=e.child,i=o.sibling;var s={mode:"hidden",children:r.children};return(a&1)===0&&n.child!==o?(r=n.child,r.childLanes=0,r.pendingProps=s,n.deletions=null):(r=wt(o,s),r.subtreeFlags=o.subtreeFlags&14680064),i!==null?u=wt(i,u):(u=Ut(u,a,t,null),u.flags|=2),u.return=n,r.return=n,r.sibling=u,n.child=r,r=u,u=n.child,a=e.child.memoizedState,a=a===null?ss(t):{baseLanes:a.baseLanes|t,cachePool:null,transitions:a.transitions},u.memoizedState=a,u.childLanes=e.childLanes&~t,n.memoizedState=is,r}return u=e.child,e=u.sibling,r=wt(u,{mode:"visible",children:r.children}),(n.mode&1)===0&&(r.lanes=t),r.return=n,r.sibling=null,e!==null&&(t=n.deletions,t===null?(n.deletions=[e],n.flags|=16):t.push(e)),n.child=r,n.memoizedState=null,r}function Xs(e,n){return n=da({mode:"visible",children:n},e.mode,0,null),n.return=e,e.child=n}function vu(e,n,t,r){return r!==null&&Ls(r),Dr(n,e.child,null,t),e=Xs(n,n.pendingProps.children),e.flags|=2,n.memoizedState=null,e}function Zg(e,n,t,r,o,u,a){if(t)return n.flags&256?(n.flags&=-257,r=ki(Error(E(422))),vu(e,n,a,r)):n.memoizedState!==null?(n.child=e.child,n.flags|=128,null):(u=r.fallback,o=n.mode,r=da({mode:"visible",children:r.children},o,0,null),u=Ut(u,o,a,null),u.flags|=2,r.return=n,u.return=n,r.sibling=u,n.child=r,(n.mode&1)!==0&&Dr(n,e.child,null,a),n.child.memoizedState=ss(a),n.memoizedState=is,u);if((n.mode&1)===0)return vu(e,n,a,null);if(o.data==="$!"){if(r=o.nextSibling&&o.nextSibling.dataset,r)var i=r.dgst;return r=i,u=Error(E(419)),r=ki(u,r,void 0),vu(e,n,a,r)}if(i=(a&e.childLanes)!==0,je||i){if(r=me,r!==null){switch(a&-a){case 4:o=2;break;case 16:o=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:o=32;break;case 536870912:o=268435456;break;default:o=0}o=(o&(r.suspendedLanes|a))!==0?0:o,o!==0&&o!==u.retryLane&&(u.retryLane=o,Xn(e,o),bn(r,e,o,-1))}return tl(),r=ki(Error(E(421))),vu(e,n,a,r)}return o.data==="$?"?(n.flags|=128,n.child=e.child,n=i2.bind(null,e),o._reactRetry=n,null):(e=u.treeContext,Ze=xt(o.nextSibling),Ge=n,ee=!0,xn=null,e!==null&&(on[un++]=$n,on[un++]=Wn,on[un++]=qt,$n=e.id,Wn=e.overflow,qt=n),n=Xs(n,r.children),n.flags|=4096,n)}function cd(e,n,t){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n),ns(e.return,n,t)}function Ci(e,n,t,r,o){var u=e.memoizedState;u===null?e.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:t,tailMode:o}:(u.isBackwards=n,u.rendering=null,u.renderingStartTime=0,u.last=r,u.tail=t,u.tailMode=o)}function Kp(e,n,t){var r=n.pendingProps,o=r.revealOrder,u=r.tail;if(Re(e,n,r.children,t),r=ne.current,(r&2)!==0)r=r&1|2,n.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=n.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&cd(e,t,n);else if(e.tag===19)cd(e,t,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break e;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(Y(ne,r),(n.mode&1)===0)n.memoizedState=null;else switch(o){case"forwards":for(t=n.child,o=null;t!==null;)e=t.alternate,e!==null&&Qu(e)===null&&(o=t),t=t.sibling;t=o,t===null?(o=n.child,n.child=null):(o=t.sibling,t.sibling=null),Ci(n,!1,o,t,u);break;case"backwards":for(t=null,o=n.child,n.child=null;o!==null;){if(e=o.alternate,e!==null&&Qu(e)===null){n.child=o;break}e=o.sibling,o.sibling=t,t=o,o=e}Ci(n,!0,t,null,u);break;case"together":Ci(n,!1,null,null,void 0);break;default:n.memoizedState=null}return n.child}function Tu(e,n){(n.mode&1)===0&&e!==null&&(e.alternate=null,n.alternate=null,n.flags|=2)}function Yn(e,n,t){if(e!==null&&(n.dependencies=e.dependencies),Vt|=n.lanes,(t&n.childLanes)===0)return null;if(e!==null&&n.child!==e.child)throw Error(E(153));if(n.child!==null){for(e=n.child,t=wt(e,e.pendingProps),n.child=t,t.return=n;e.sibling!==null;)e=e.sibling,t=t.sibling=wt(e,e.pendingProps),t.return=n;t.sibling=null}return n.child}function Gg(e,n,t){switch(n.tag){case 3:Xp(n),Ar();break;case 5:_p(n);break;case 1:He(n.type)&&ju(n);break;case 4:qs(n,n.stateNode.containerInfo);break;case 10:var r=n.type._context,o=n.memoizedProps.value;Y(Vu,r._currentValue),r._currentValue=o;break;case 13:if(r=n.memoizedState,r!==null)return r.dehydrated!==null?(Y(ne,ne.current&1),n.flags|=128,null):(t&n.child.childLanes)!==0?Yp(e,n,t):(Y(ne,ne.current&1),e=Yn(e,n,t),e!==null?e.sibling:null);Y(ne,ne.current&1);break;case 19:if(r=(t&n.childLanes)!==0,(e.flags&128)!==0){if(r)return Kp(e,n,t);n.flags|=128}if(o=n.memoizedState,o!==null&&(o.rendering=null,o.tail=null,o.lastEffect=null),Y(ne,ne.current),r)break;return null;case 22:case 23:return n.lanes=0,Zp(e,n,t)}return Yn(e,n,t)}var Jp,ls,ef,nf;Jp=function(e,n){for(var t=n.child;t!==null;){if(t.tag===5||t.tag===6)e.appendChild(t.stateNode);else if(t.tag!==4&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break;for(;t.sibling===null;){if(t.return===null||t.return===n)return;t=t.return}t.sibling.return=t.return,t=t.sibling}};ls=function(){};ef=function(e,n,t,r){var o=e.memoizedProps;if(o!==r){e=n.stateNode,Ot(Dn.current);var u=null;switch(t){case"input":o=Ni(e,o),r=Ni(e,r),u=[];break;case"select":o=re({},o,{value:void 0}),r=re({},r,{value:void 0}),u=[];break;case"textarea":o=Mi(e,o),r=Mi(e,r),u=[];break;default:typeof o.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=Bu)}Li(t,r);var a;t=null;for(l in o)if(!r.hasOwnProperty(l)&&o.hasOwnProperty(l)&&o[l]!=null)if(l==="style"){var i=o[l];for(a in i)i.hasOwnProperty(a)&&(t||(t={}),t[a]="")}else l!=="dangerouslySetInnerHTML"&&l!=="children"&&l!=="suppressContentEditableWarning"&&l!=="suppressHydrationWarning"&&l!=="autoFocus"&&(go.hasOwnProperty(l)?u||(u=[]):(u=u||[]).push(l,null));for(l in r){var s=r[l];if(i=o?.[l],r.hasOwnProperty(l)&&s!==i&&(s!=null||i!=null))if(l==="style")if(i){for(a in i)!i.hasOwnProperty(a)||s&&s.hasOwnProperty(a)||(t||(t={}),t[a]="");for(a in s)s.hasOwnProperty(a)&&i[a]!==s[a]&&(t||(t={}),t[a]=s[a])}else t||(u||(u=[]),u.push(l,t)),t=s;else l==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,i=i?i.__html:void 0,s!=null&&i!==s&&(u=u||[]).push(l,s)):l==="children"?typeof s!="string"&&typeof s!="number"||(u=u||[]).push(l,""+s):l!=="suppressContentEditableWarning"&&l!=="suppressHydrationWarning"&&(go.hasOwnProperty(l)?(s!=null&&l==="onScroll"&&K("scroll",e),u||i===s||(u=[])):(u=u||[]).push(l,s))}t&&(u=u||[]).push("style",t);var l=u;(n.updateQueue=l)&&(n.flags|=4)}};nf=function(e,n,t,r){t!==r&&(n.flags|=4)};function Jr(e,n){if(!ee)switch(e.tailMode){case"hidden":n=e.tail;for(var t=null;n!==null;)n.alternate!==null&&(t=n),n=n.sibling;t===null?e.tail=null:t.sibling=null;break;case"collapsed":t=e.tail;for(var r=null;t!==null;)t.alternate!==null&&(r=t),t=t.sibling;r===null?n||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Te(e){var n=e.alternate!==null&&e.alternate.child===e.child,t=0,r=0;if(n)for(var o=e.child;o!==null;)t|=o.lanes|o.childLanes,r|=o.subtreeFlags&14680064,r|=o.flags&14680064,o.return=e,o=o.sibling;else for(o=e.child;o!==null;)t|=o.lanes|o.childLanes,r|=o.subtreeFlags,r|=o.flags,o.return=e,o=o.sibling;return e.subtreeFlags|=r,e.childLanes=t,n}function Xg(e,n,t){var r=n.pendingProps;switch(Ps(n),n.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Te(n),null;case 1:return He(n.type)&&Uu(),Te(n),null;case 3:return r=n.stateNode,Fr(),J(qe),J(De),Vs(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(gu(n)?n.flags|=4:e===null||e.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,xn!==null&&(xs(xn),xn=null))),ls(e,n),Te(n),null;case 5:Hs(n);var o=Ot(Ao.current);if(t=n.type,e!==null&&n.stateNode!=null)ef(e,n,t,r,o),e.ref!==n.ref&&(n.flags|=512,n.flags|=2097152);else{if(!r){if(n.stateNode===null)throw Error(E(166));return Te(n),null}if(e=Ot(Dn.current),gu(n)){r=n.stateNode,t=n.type;var u=n.memoizedProps;switch(r[Tn]=n,r[Eo]=u,e=(n.mode&1)!==0,t){case"dialog":K("cancel",r),K("close",r);break;case"iframe":case"object":case"embed":K("load",r);break;case"video":case"audio":for(o=0;o<uo.length;o++)K(uo[o],r);break;case"source":K("error",r);break;case"img":case"image":case"link":K("error",r),K("load",r);break;case"details":K("toggle",r);break;case"input":v0(r,u),K("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!u.multiple},K("invalid",r);break;case"textarea":y0(r,u),K("invalid",r)}Li(t,u),o=null;for(var a in u)if(u.hasOwnProperty(a)){var i=u[a];a==="children"?typeof i=="string"?r.textContent!==i&&(u.suppressHydrationWarning!==!0&&hu(r.textContent,i,e),o=["children",i]):typeof i=="number"&&r.textContent!==""+i&&(u.suppressHydrationWarning!==!0&&hu(r.textContent,i,e),o=["children",""+i]):go.hasOwnProperty(a)&&i!=null&&a==="onScroll"&&K("scroll",r)}switch(t){case"input":ru(r),b0(r,u,!0);break;case"textarea":ru(r),w0(r);break;case"select":case"option":break;default:typeof u.onClick=="function"&&(r.onclick=Bu)}r=o,n.updateQueue=r,r!==null&&(n.flags|=4)}else{a=o.nodeType===9?o:o.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Dd(t)),e==="http://www.w3.org/1999/xhtml"?t==="script"?(e=a.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=a.createElement(t,{is:r.is}):(e=a.createElement(t),t==="select"&&(a=e,r.multiple?a.multiple=!0:r.size&&(a.size=r.size))):e=a.createElementNS(e,t),e[Tn]=n,e[Eo]=r,Jp(e,n,!1,!1),n.stateNode=e;e:{switch(a=zi(t,r),t){case"dialog":K("cancel",e),K("close",e),o=r;break;case"iframe":case"object":case"embed":K("load",e),o=r;break;case"video":case"audio":for(o=0;o<uo.length;o++)K(uo[o],e);o=r;break;case"source":K("error",e),o=r;break;case"img":case"image":case"link":K("error",e),K("load",e),o=r;break;case"details":K("toggle",e),o=r;break;case"input":v0(e,r),o=Ni(e,r),K("invalid",e);break;case"option":o=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},o=re({},r,{value:void 0}),K("invalid",e);break;case"textarea":y0(e,r),o=Mi(e,r),K("invalid",e);break;default:o=r}Li(t,o),i=o;for(u in i)if(i.hasOwnProperty(u)){var s=i[u];u==="style"?Rd(e,s):u==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,s!=null&&Fd(e,s)):u==="children"?typeof s=="string"?(t!=="textarea"||s!=="")&&xo(e,s):typeof s=="number"&&xo(e,""+s):u!=="suppressContentEditableWarning"&&u!=="suppressHydrationWarning"&&u!=="autoFocus"&&(go.hasOwnProperty(u)?s!=null&&u==="onScroll"&&K("scroll",e):s!=null&&ys(e,u,s,a))}switch(t){case"input":ru(e),b0(e,r,!1);break;case"textarea":ru(e),w0(e);break;case"option":r.value!=null&&e.setAttribute("value",""+kt(r.value));break;case"select":e.multiple=!!r.multiple,u=r.value,u!=null?yr(e,!!r.multiple,u,!1):r.defaultValue!=null&&yr(e,!!r.multiple,r.defaultValue,!0);break;default:typeof o.onClick=="function"&&(e.onclick=Bu)}switch(t){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(n.flags|=4)}n.ref!==null&&(n.flags|=512,n.flags|=2097152)}return Te(n),null;case 6:if(e&&n.stateNode!=null)nf(e,n,e.memoizedProps,r);else{if(typeof r!="string"&&n.stateNode===null)throw Error(E(166));if(t=Ot(Ao.current),Ot(Dn.current),gu(n)){if(r=n.stateNode,t=n.memoizedProps,r[Tn]=n,(u=r.nodeValue!==t)&&(e=Ge,e!==null))switch(e.tag){case 3:hu(r.nodeValue,t,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&hu(r.nodeValue,t,(e.mode&1)!==0)}u&&(n.flags|=4)}else r=(t.nodeType===9?t:t.ownerDocument).createTextNode(r),r[Tn]=n,n.stateNode=r}return Te(n),null;case 13:if(J(ne),r=n.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(ee&&Ze!==null&&(n.mode&1)!==0&&(n.flags&128)===0)bp(),Ar(),n.flags|=98560,u=!1;else if(u=gu(n),r!==null&&r.dehydrated!==null){if(e===null){if(!u)throw Error(E(318));if(u=n.memoizedState,u=u!==null?u.dehydrated:null,!u)throw Error(E(317));u[Tn]=n}else Ar(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Te(n),u=!1}else xn!==null&&(xs(xn),xn=null),u=!0;if(!u)return n.flags&65536?n:null}return(n.flags&128)!==0?(n.lanes=t,n):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(n.child.flags|=8192,(n.mode&1)!==0&&(e===null||(ne.current&1)!==0?le===0&&(le=3):tl())),n.updateQueue!==null&&(n.flags|=4),Te(n),null);case 4:return Fr(),ls(e,n),e===null&&_o(n.stateNode.containerInfo),Te(n),null;case 10:return Bs(n.type._context),Te(n),null;case 17:return He(n.type)&&Uu(),Te(n),null;case 19:if(J(ne),u=n.memoizedState,u===null)return Te(n),null;if(r=(n.flags&128)!==0,a=u.rendering,a===null)if(r)Jr(u,!1);else{if(le!==0||e!==null&&(e.flags&128)!==0)for(e=n.child;e!==null;){if(a=Qu(e),a!==null){for(n.flags|=128,Jr(u,!1),r=a.updateQueue,r!==null&&(n.updateQueue=r,n.flags|=4),n.subtreeFlags=0,r=t,t=n.child;t!==null;)u=t,e=r,u.flags&=14680066,a=u.alternate,a===null?(u.childLanes=0,u.lanes=e,u.child=null,u.subtreeFlags=0,u.memoizedProps=null,u.memoizedState=null,u.updateQueue=null,u.dependencies=null,u.stateNode=null):(u.childLanes=a.childLanes,u.lanes=a.lanes,u.child=a.child,u.subtreeFlags=0,u.deletions=null,u.memoizedProps=a.memoizedProps,u.memoizedState=a.memoizedState,u.updateQueue=a.updateQueue,u.type=a.type,e=a.dependencies,u.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t=t.sibling;return Y(ne,ne.current&1|2),n.child}e=e.sibling}u.tail!==null&&ae()>Rr&&(n.flags|=128,r=!0,Jr(u,!1),n.lanes=4194304)}else{if(!r)if(e=Qu(a),e!==null){if(n.flags|=128,r=!0,t=e.updateQueue,t!==null&&(n.updateQueue=t,n.flags|=4),Jr(u,!0),u.tail===null&&u.tailMode==="hidden"&&!a.alternate&&!ee)return Te(n),null}else 2*ae()-u.renderingStartTime>Rr&&t!==1073741824&&(n.flags|=128,r=!0,Jr(u,!1),n.lanes=4194304);u.isBackwards?(a.sibling=n.child,n.child=a):(t=u.last,t!==null?t.sibling=a:n.child=a,u.last=a)}return u.tail!==null?(n=u.tail,u.rendering=n,u.tail=n.sibling,u.renderingStartTime=ae(),n.sibling=null,t=ne.current,Y(ne,r?t&1|2:t&1),n):(Te(n),null);case 22:case 23:return nl(),r=n.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(n.flags|=8192),r&&(n.mode&1)!==0?(Qe&1073741824)!==0&&(Te(n),n.subtreeFlags&6&&(n.flags|=8192)):Te(n),null;case 24:return null;case 25:return null}throw Error(E(156,n.tag))}function Yg(e,n){switch(Ps(n),n.tag){case 1:return He(n.type)&&Uu(),e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 3:return Fr(),J(qe),J(De),Vs(),e=n.flags,(e&65536)!==0&&(e&128)===0?(n.flags=e&-65537|128,n):null;case 5:return Hs(n),null;case 13:if(J(ne),e=n.memoizedState,e!==null&&e.dehydrated!==null){if(n.alternate===null)throw Error(E(340));Ar()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 19:return J(ne),null;case 4:return Fr(),null;case 10:return Bs(n.type._context),null;case 22:case 23:return nl(),null;case 24:return null;default:return null}}var bu=!1,Ae=!1,Kg=typeof WeakSet=="function"?WeakSet:Set,F=null;function vr(e,n){var t=e.ref;if(t!==null)if(typeof t=="function")try{t(null)}catch(r){oe(e,n,r)}else t.current=null}function cs(e,n,t){try{t()}catch(r){oe(e,n,r)}}var dd=!1;function Jg(e,n){if(Qi=Lu,e=ap(),Is(e)){if("selectionStart"in e)var t={start:e.selectionStart,end:e.selectionEnd};else e:{t=(t=e.ownerDocument)&&t.defaultView||window;var r=t.getSelection&&t.getSelection();if(r&&r.rangeCount!==0){t=r.anchorNode;var o=r.anchorOffset,u=r.focusNode;r=r.focusOffset;try{t.nodeType,u.nodeType}catch{t=null;break e}var a=0,i=-1,s=-1,l=0,f=0,m=e,g=null;n:for(;;){for(var v;m!==t||o!==0&&m.nodeType!==3||(i=a+o),m!==u||r!==0&&m.nodeType!==3||(s=a+r),m.nodeType===3&&(a+=m.nodeValue.length),(v=m.firstChild)!==null;)g=m,m=v;for(;;){if(m===e)break n;if(g===t&&++l===o&&(i=a),g===u&&++f===r&&(s=a),(v=m.nextSibling)!==null)break;m=g,g=m.parentNode}m=v}t=i===-1||s===-1?null:{start:i,end:s}}else t=null}t=t||{start:0,end:0}}else t=null;for(Zi={focusedElem:e,selectionRange:t},Lu=!1,F=n;F!==null;)if(n=F,e=n.child,(n.subtreeFlags&1028)!==0&&e!==null)e.return=n,F=e;else for(;F!==null;){n=F;try{var x=n.alternate;if((n.flags&1024)!==0)switch(n.tag){case 0:case 11:case 15:break;case 1:if(x!==null){var w=x.memoizedProps,C=x.memoizedState,h=n.stateNode,d=h.getSnapshotBeforeUpdate(n.elementType===n.type?w:hn(n.type,w),C);h.__reactInternalSnapshotBeforeUpdate=d}break;case 3:var c=n.stateNode.containerInfo;c.nodeType===1?c.textContent="":c.nodeType===9&&c.documentElement&&c.removeChild(c.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(E(163))}}catch(p){oe(n,n.return,p)}if(e=n.sibling,e!==null){e.return=n.return,F=e;break}F=n.return}return x=dd,dd=!1,x}function fo(e,n,t){var r=n.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var o=r=r.next;do{if((o.tag&e)===e){var u=o.destroy;o.destroy=void 0,u!==void 0&&cs(n,t,u)}o=o.next}while(o!==r)}}function la(e,n){if(n=n.updateQueue,n=n!==null?n.lastEffect:null,n!==null){var t=n=n.next;do{if((t.tag&e)===e){var r=t.create;t.destroy=r()}t=t.next}while(t!==n)}}function ds(e){var n=e.ref;if(n!==null){var t=e.stateNode;switch(e.tag){case 5:e=t;break;default:e=t}typeof n=="function"?n(e):n.current=e}}function tf(e){var n=e.alternate;n!==null&&(e.alternate=null,tf(n)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(n=e.stateNode,n!==null&&(delete n[Tn],delete n[Eo],delete n[Yi],delete n[Pg],delete n[Lg])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function rf(e){return e.tag===5||e.tag===3||e.tag===4}function pd(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||rf(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function ps(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.nodeType===8?t.parentNode.insertBefore(e,n):t.insertBefore(e,n):(t.nodeType===8?(n=t.parentNode,n.insertBefore(e,t)):(n=t,n.appendChild(e)),t=t._reactRootContainer,t!=null||n.onclick!==null||(n.onclick=Bu));else if(r!==4&&(e=e.child,e!==null))for(ps(e,n,t),e=e.sibling;e!==null;)ps(e,n,t),e=e.sibling}function fs(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.insertBefore(e,n):t.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(fs(e,n,t),e=e.sibling;e!==null;)fs(e,n,t),e=e.sibling}var ve=null,gn=!1;function it(e,n,t){for(t=t.child;t!==null;)of(e,n,t),t=t.sibling}function of(e,n,t){if(An&&typeof An.onCommitFiberUnmount=="function")try{An.onCommitFiberUnmount(na,t)}catch{}switch(t.tag){case 5:Ae||vr(t,n);case 6:var r=ve,o=gn;ve=null,it(e,n,t),ve=r,gn=o,ve!==null&&(gn?(e=ve,t=t.stateNode,e.nodeType===8?e.parentNode.removeChild(t):e.removeChild(t)):ve.removeChild(t.stateNode));break;case 18:ve!==null&&(gn?(e=ve,t=t.stateNode,e.nodeType===8?gi(e.parentNode,t):e.nodeType===1&&gi(e,t),wo(e)):gi(ve,t.stateNode));break;case 4:r=ve,o=gn,ve=t.stateNode.containerInfo,gn=!0,it(e,n,t),ve=r,gn=o;break;case 0:case 11:case 14:case 15:if(!Ae&&(r=t.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){o=r=r.next;do{var u=o,a=u.destroy;u=u.tag,a!==void 0&&((u&2)!==0||(u&4)!==0)&&cs(t,n,a),o=o.next}while(o!==r)}it(e,n,t);break;case 1:if(!Ae&&(vr(t,n),r=t.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=t.memoizedProps,r.state=t.memoizedState,r.componentWillUnmount()}catch(i){oe(t,n,i)}it(e,n,t);break;case 21:it(e,n,t);break;case 22:t.mode&1?(Ae=(r=Ae)||t.memoizedState!==null,it(e,n,t),Ae=r):it(e,n,t);break;default:it(e,n,t)}}function fd(e){var n=e.updateQueue;if(n!==null){e.updateQueue=null;var t=e.stateNode;t===null&&(t=e.stateNode=new Kg),n.forEach(function(r){var o=s2.bind(null,e,r);t.has(r)||(t.add(r),r.then(o,o))})}}function mn(e,n){var t=n.deletions;if(t!==null)for(var r=0;r<t.length;r++){var o=t[r];try{var u=e,a=n,i=a;e:for(;i!==null;){switch(i.tag){case 5:ve=i.stateNode,gn=!1;break e;case 3:ve=i.stateNode.containerInfo,gn=!0;break e;case 4:ve=i.stateNode.containerInfo,gn=!0;break e}i=i.return}if(ve===null)throw Error(E(160));of(u,a,o),ve=null,gn=!1;var s=o.alternate;s!==null&&(s.return=null),o.return=null}catch(l){oe(o,n,l)}}if(n.subtreeFlags&12854)for(n=n.child;n!==null;)uf(n,e),n=n.sibling}function uf(e,n){var t=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(mn(n,e),Sn(e),r&4){try{fo(3,e,e.return),la(3,e)}catch(w){oe(e,e.return,w)}try{fo(5,e,e.return)}catch(w){oe(e,e.return,w)}}break;case 1:mn(n,e),Sn(e),r&512&&t!==null&&vr(t,t.return);break;case 5:if(mn(n,e),Sn(e),r&512&&t!==null&&vr(t,t.return),e.flags&32){var o=e.stateNode;try{xo(o,"")}catch(w){oe(e,e.return,w)}}if(r&4&&(o=e.stateNode,o!=null)){var u=e.memoizedProps,a=t!==null?t.memoizedProps:u,i=e.type,s=e.updateQueue;if(e.updateQueue=null,s!==null)try{i==="input"&&u.type==="radio"&&u.name!=null&&Td(o,u),zi(i,a);var l=zi(i,u);for(a=0;a<s.length;a+=2){var f=s[a],m=s[a+1];f==="style"?Rd(o,m):f==="dangerouslySetInnerHTML"?Fd(o,m):f==="children"?xo(o,m):ys(o,f,m,l)}switch(i){case"input":Ri(o,u);break;case"textarea":Ad(o,u);break;case"select":var g=o._wrapperState.wasMultiple;o._wrapperState.wasMultiple=!!u.multiple;var v=u.value;v!=null?yr(o,!!u.multiple,v,!1):g!==!!u.multiple&&(u.defaultValue!=null?yr(o,!!u.multiple,u.defaultValue,!0):yr(o,!!u.multiple,u.multiple?[]:"",!1))}o[Eo]=u}catch(w){oe(e,e.return,w)}}break;case 6:if(mn(n,e),Sn(e),r&4){if(e.stateNode===null)throw Error(E(162));o=e.stateNode,u=e.memoizedProps;try{o.nodeValue=u}catch(w){oe(e,e.return,w)}}break;case 3:if(mn(n,e),Sn(e),r&4&&t!==null&&t.memoizedState.isDehydrated)try{wo(n.containerInfo)}catch(w){oe(e,e.return,w)}break;case 4:mn(n,e),Sn(e);break;case 13:mn(n,e),Sn(e),o=e.child,o.flags&8192&&(u=o.memoizedState!==null,o.stateNode.isHidden=u,!u||o.alternate!==null&&o.alternate.memoizedState!==null||(Js=ae())),r&4&&fd(e);break;case 22:if(f=t!==null&&t.memoizedState!==null,e.mode&1?(Ae=(l=Ae)||f,mn(n,e),Ae=l):mn(n,e),Sn(e),r&8192){if(l=e.memoizedState!==null,(e.stateNode.isHidden=l)&&!f&&(e.mode&1)!==0)for(F=e,f=e.child;f!==null;){for(m=F=f;F!==null;){switch(g=F,v=g.child,g.tag){case 0:case 11:case 14:case 15:fo(4,g,g.return);break;case 1:vr(g,g.return);var x=g.stateNode;if(typeof x.componentWillUnmount=="function"){r=g,t=g.return;try{n=r,x.props=n.memoizedProps,x.state=n.memoizedState,x.componentWillUnmount()}catch(w){oe(r,t,w)}}break;case 5:vr(g,g.return);break;case 22:if(g.memoizedState!==null){hd(m);continue}}v!==null?(v.return=g,F=v):hd(m)}f=f.sibling}e:for(f=null,m=e;;){if(m.tag===5){if(f===null){f=m;try{o=m.stateNode,l?(u=o.style,typeof u.setProperty=="function"?u.setProperty("display","none","important"):u.display="none"):(i=m.stateNode,s=m.memoizedProps.style,a=s!=null&&s.hasOwnProperty("display")?s.display:null,i.style.display=Nd("display",a))}catch(w){oe(e,e.return,w)}}}else if(m.tag===6){if(f===null)try{m.stateNode.nodeValue=l?"":m.memoizedProps}catch(w){oe(e,e.return,w)}}else if((m.tag!==22&&m.tag!==23||m.memoizedState===null||m===e)&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===e)break e;for(;m.sibling===null;){if(m.return===null||m.return===e)break e;f===m&&(f=null),m=m.return}f===m&&(f=null),m.sibling.return=m.return,m=m.sibling}}break;case 19:mn(n,e),Sn(e),r&4&&fd(e);break;case 21:break;default:mn(n,e),Sn(e)}}function Sn(e){var n=e.flags;if(n&2){try{e:{for(var t=e.return;t!==null;){if(rf(t)){var r=t;break e}t=t.return}throw Error(E(160))}switch(r.tag){case 5:var o=r.stateNode;r.flags&32&&(xo(o,""),r.flags&=-33);var u=pd(e);fs(e,u,o);break;case 3:case 4:var a=r.stateNode.containerInfo,i=pd(e);ps(e,i,a);break;default:throw Error(E(161))}}catch(s){oe(e,e.return,s)}e.flags&=-3}n&4096&&(e.flags&=-4097)}function e2(e,n,t){F=e,af(e,n,t)}function af(e,n,t){for(var r=(e.mode&1)!==0;F!==null;){var o=F,u=o.child;if(o.tag===22&&r){var a=o.memoizedState!==null||bu;if(!a){var i=o.alternate,s=i!==null&&i.memoizedState!==null||Ae;i=bu;var l=Ae;if(bu=a,(Ae=s)&&!l)for(F=o;F!==null;)a=F,s=a.child,a.tag===22&&a.memoizedState!==null?gd(o):s!==null?(s.return=a,F=s):gd(o);for(;u!==null;)F=u,af(u,n,t),u=u.sibling;F=o,bu=i,Ae=l}md(e,n,t)}else(o.subtreeFlags&8772)!==0&&u!==null?(u.return=o,F=u):md(e,n,t)}}function md(e){for(;F!==null;){var n=F;if((n.flags&8772)!==0){var t=n.alternate;try{if((n.flags&8772)!==0)switch(n.tag){case 0:case 11:case 15:Ae||la(5,n);break;case 1:var r=n.stateNode;if(n.flags&4&&!Ae)if(t===null)r.componentDidMount();else{var o=n.elementType===n.type?t.memoizedProps:hn(n.type,t.memoizedProps);r.componentDidUpdate(o,t.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var u=n.updateQueue;u!==null&&K0(n,u,r);break;case 3:var a=n.updateQueue;if(a!==null){if(t=null,n.child!==null)switch(n.child.tag){case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}K0(n,a,t)}break;case 5:var i=n.stateNode;if(t===null&&n.flags&4){t=i;var s=n.memoizedProps;switch(n.type){case"button":case"input":case"select":case"textarea":s.autoFocus&&t.focus();break;case"img":s.src&&(t.src=s.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(n.memoizedState===null){var l=n.alternate;if(l!==null){var f=l.memoizedState;if(f!==null){var m=f.dehydrated;m!==null&&wo(m)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(E(163))}Ae||n.flags&512&&ds(n)}catch(g){oe(n,n.return,g)}}if(n===e){F=null;break}if(t=n.sibling,t!==null){t.return=n.return,F=t;break}F=n.return}}function hd(e){for(;F!==null;){var n=F;if(n===e){F=null;break}var t=n.sibling;if(t!==null){t.return=n.return,F=t;break}F=n.return}}function gd(e){for(;F!==null;){var n=F;try{switch(n.tag){case 0:case 11:case 15:var t=n.return;try{la(4,n)}catch(s){oe(n,t,s)}break;case 1:var r=n.stateNode;if(typeof r.componentDidMount=="function"){var o=n.return;try{r.componentDidMount()}catch(s){oe(n,o,s)}}var u=n.return;try{ds(n)}catch(s){oe(n,u,s)}break;case 5:var a=n.return;try{ds(n)}catch(s){oe(n,a,s)}}}catch(s){oe(n,n.return,s)}if(n===e){F=null;break}var i=n.sibling;if(i!==null){i.return=n.return,F=i;break}F=n.return}}var n2=Math.ceil,Xu=Kn.ReactCurrentDispatcher,Ys=Kn.ReactCurrentOwner,sn=Kn.ReactCurrentBatchConfig,V=0,me=null,ie=null,be=0,Qe=0,br=St(0),le=0,Ro=null,Vt=0,ca=0,Ks=0,mo=null,Ue=null,Js=0,Rr=1/0,Hn=null,Yu=!1,ms=null,bt=null,yu=!1,ft=null,Ku=0,ho=0,hs=null,Au=-1,Du=0;function Ie(){return(V&6)!==0?ae():Au!==-1?Au:Au=ae()}function yt(e){return(e.mode&1)===0?1:(V&2)!==0&&be!==0?be&-be:Og.transition!==null?(Du===0&&(Du=Vd()),Du):(e=Q,e!==0||(e=window.event,e=e===void 0?16:Yd(e.type)),e)}function bn(e,n,t,r){if(50<ho)throw ho=0,hs=null,Error(E(185));Io(e,t,r),((V&2)===0||e!==me)&&(e===me&&((V&2)===0&&(ca|=t),le===4&&dt(e,be)),Ve(e,r),t===1&&V===0&&(n.mode&1)===0&&(Rr=ae()+500,aa&&Et()))}function Ve(e,n){var t=e.callbackNode;Uh(e,n);var r=Pu(e,e===me?be:0);if(r===0)t!==null&&_0(t),e.callbackNode=null,e.callbackPriority=0;else if(n=r&-r,e.callbackPriority!==n){if(t!=null&&_0(t),n===1)e.tag===0?zg(xd.bind(null,e)):gp(xd.bind(null,e)),Ig(function(){(V&6)===0&&Et()}),t=null;else{switch($d(r)){case 1:t=Ss;break;case 4:t=qd;break;case 16:t=Mu;break;case 536870912:t=Hd;break;default:t=Mu}t=hf(t,sf.bind(null,e))}e.callbackPriority=n,e.callbackNode=t}}function sf(e,n){if(Au=-1,Du=0,(V&6)!==0)throw Error(E(327));var t=e.callbackNode;if(Sr()&&e.callbackNode!==t)return null;var r=Pu(e,e===me?be:0);if(r===0)return null;if((r&30)!==0||(r&e.expiredLanes)!==0||n)n=Ju(e,r);else{n=r;var o=V;V|=2;var u=cf();(me!==e||be!==n)&&(Hn=null,Rr=ae()+500,Bt(e,n));do try{o2();break}catch(i){lf(e,i)}while(!0);Os(),Xu.current=u,V=o,ie!==null?n=0:(me=null,be=0,n=le)}if(n!==0){if(n===2&&(o=qi(e),o!==0&&(r=o,n=gs(e,o))),n===1)throw t=Ro,Bt(e,0),dt(e,r),Ve(e,ae()),t;if(n===6)dt(e,r);else{if(o=e.current.alternate,(r&30)===0&&!t2(o)&&(n=Ju(e,r),n===2&&(u=qi(e),u!==0&&(r=u,n=gs(e,u))),n===1))throw t=Ro,Bt(e,0),dt(e,r),Ve(e,ae()),t;switch(e.finishedWork=o,e.finishedLanes=r,n){case 0:case 1:throw Error(E(345));case 2:Pt(e,Ue,Hn);break;case 3:if(dt(e,r),(r&130023424)===r&&(n=Js+500-ae(),10<n)){if(Pu(e,0)!==0)break;if(o=e.suspendedLanes,(o&r)!==r){Ie(),e.pingedLanes|=e.suspendedLanes&o;break}e.timeoutHandle=Xi(Pt.bind(null,e,Ue,Hn),n);break}Pt(e,Ue,Hn);break;case 4:if(dt(e,r),(r&4194240)===r)break;for(n=e.eventTimes,o=-1;0<r;){var a=31-vn(r);u=1<<a,a=n[a],a>o&&(o=a),r&=~u}if(r=o,r=ae()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*n2(r/1960))-r,10<r){e.timeoutHandle=Xi(Pt.bind(null,e,Ue,Hn),r);break}Pt(e,Ue,Hn);break;case 5:Pt(e,Ue,Hn);break;default:throw Error(E(329))}}}return Ve(e,ae()),e.callbackNode===t?sf.bind(null,e):null}function gs(e,n){var t=mo;return e.current.memoizedState.isDehydrated&&(Bt(e,n).flags|=256),e=Ju(e,n),e!==2&&(n=Ue,Ue=t,n!==null&&xs(n)),e}function xs(e){Ue===null?Ue=e:Ue.push.apply(Ue,e)}function t2(e){for(var n=e;;){if(n.flags&16384){var t=n.updateQueue;if(t!==null&&(t=t.stores,t!==null))for(var r=0;r<t.length;r++){var o=t[r],u=o.getSnapshot;o=o.value;try{if(!yn(u(),o))return!1}catch{return!1}}}if(t=n.child,n.subtreeFlags&16384&&t!==null)t.return=n,n=t;else{if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function dt(e,n){for(n&=~Ks,n&=~ca,e.suspendedLanes|=n,e.pingedLanes&=~n,e=e.expirationTimes;0<n;){var t=31-vn(n),r=1<<t;e[t]=-1,n&=~r}}function xd(e){if((V&6)!==0)throw Error(E(327));Sr();var n=Pu(e,0);if((n&1)===0)return Ve(e,ae()),null;var t=Ju(e,n);if(e.tag!==0&&t===2){var r=qi(e);r!==0&&(n=r,t=gs(e,r))}if(t===1)throw t=Ro,Bt(e,0),dt(e,n),Ve(e,ae()),t;if(t===6)throw Error(E(345));return e.finishedWork=e.current.alternate,e.finishedLanes=n,Pt(e,Ue,Hn),Ve(e,ae()),null}function el(e,n){var t=V;V|=1;try{return e(n)}finally{V=t,V===0&&(Rr=ae()+500,aa&&Et())}}function $t(e){ft!==null&&ft.tag===0&&(V&6)===0&&Sr();var n=V;V|=1;var t=sn.transition,r=Q;try{if(sn.transition=null,Q=1,e)return e()}finally{Q=r,sn.transition=t,V=n,(V&6)===0&&Et()}}function nl(){Qe=br.current,J(br)}function Bt(e,n){e.finishedWork=null,e.finishedLanes=0;var t=e.timeoutHandle;if(t!==-1&&(e.timeoutHandle=-1,Rg(t)),ie!==null)for(t=ie.return;t!==null;){var r=t;switch(Ps(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Uu();break;case 3:Fr(),J(qe),J(De),Vs();break;case 5:Hs(r);break;case 4:Fr();break;case 13:J(ne);break;case 19:J(ne);break;case 10:Bs(r.type._context);break;case 22:case 23:nl()}t=t.return}if(me=e,ie=e=wt(e.current,null),be=Qe=n,le=0,Ro=null,Ks=ca=Vt=0,Ue=mo=null,zt!==null){for(n=0;n<zt.length;n++)if(t=zt[n],r=t.interleaved,r!==null){t.interleaved=null;var o=r.next,u=t.pending;if(u!==null){var a=u.next;u.next=o,r.next=a}t.pending=r}zt=null}return e}function lf(e,n){do{var t=ie;try{if(Os(),Su.current=Gu,Zu){for(var r=te.memoizedState;r!==null;){var o=r.queue;o!==null&&(o.pending=null),r=r.next}Zu=!1}if(Ht=0,fe=se=te=null,po=!1,Do=0,Ys.current=null,t===null||t.return===null){le=1,Ro=n,ie=null;break}e:{var u=e,a=t.return,i=t,s=n;if(n=be,i.flags|=32768,s!==null&&typeof s=="object"&&typeof s.then=="function"){var l=s,f=i,m=f.tag;if((f.mode&1)===0&&(m===0||m===11||m===15)){var g=f.alternate;g?(f.updateQueue=g.updateQueue,f.memoizedState=g.memoizedState,f.lanes=g.lanes):(f.updateQueue=null,f.memoizedState=null)}var v=od(a);if(v!==null){v.flags&=-257,ud(v,a,i,u,n),v.mode&1&&rd(u,l,n),n=v,s=l;var x=n.updateQueue;if(x===null){var w=new Set;w.add(s),n.updateQueue=w}else x.add(s);break e}else{if((n&1)===0){rd(u,l,n),tl();break e}s=Error(E(426))}}else if(ee&&i.mode&1){var C=od(a);if(C!==null){(C.flags&65536)===0&&(C.flags|=256),ud(C,a,i,u,n),Ls(Nr(s,i));break e}}u=s=Nr(s,i),le!==4&&(le=2),mo===null?mo=[u]:mo.push(u),u=a;do{switch(u.tag){case 3:u.flags|=65536,n&=-n,u.lanes|=n;var h=$p(u,s,n);Y0(u,h);break e;case 1:i=s;var d=u.type,c=u.stateNode;if((u.flags&128)===0&&(typeof d.getDerivedStateFromError=="function"||c!==null&&typeof c.componentDidCatch=="function"&&(bt===null||!bt.has(c)))){u.flags|=65536,n&=-n,u.lanes|=n;var p=Wp(u,i,n);Y0(u,p);break e}}u=u.return}while(u!==null)}pf(t)}catch(b){n=b,ie===t&&t!==null&&(ie=t=t.return);continue}break}while(!0)}function cf(){var e=Xu.current;return Xu.current=Gu,e===null?Gu:e}function tl(){(le===0||le===3||le===2)&&(le=4),me===null||(Vt&268435455)===0&&(ca&268435455)===0||dt(me,be)}function Ju(e,n){var t=V;V|=2;var r=cf();(me!==e||be!==n)&&(Hn=null,Bt(e,n));do try{r2();break}catch(o){lf(e,o)}while(!0);if(Os(),V=t,Xu.current=r,ie!==null)throw Error(E(261));return me=null,be=0,le}function r2(){for(;ie!==null;)df(ie)}function o2(){for(;ie!==null&&!Nh();)df(ie)}function df(e){var n=mf(e.alternate,e,Qe);e.memoizedProps=e.pendingProps,n===null?pf(e):ie=n,Ys.current=null}function pf(e){var n=e;do{var t=n.alternate;if(e=n.return,(n.flags&32768)===0){if(t=Xg(t,n,Qe),t!==null){ie=t;return}}else{if(t=Yg(t,n),t!==null){t.flags&=32767,ie=t;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{le=6,ie=null;return}}if(n=n.sibling,n!==null){ie=n;return}ie=n=e}while(n!==null);le===0&&(le=5)}function Pt(e,n,t){var r=Q,o=sn.transition;try{sn.transition=null,Q=1,u2(e,n,t,r)}finally{sn.transition=o,Q=r}return null}function u2(e,n,t,r){do Sr();while(ft!==null);if((V&6)!==0)throw Error(E(327));t=e.finishedWork;var o=e.finishedLanes;if(t===null)return null;if(e.finishedWork=null,e.finishedLanes=0,t===e.current)throw Error(E(177));e.callbackNode=null,e.callbackPriority=0;var u=t.lanes|t.childLanes;if(jh(e,u),e===me&&(ie=me=null,be=0),(t.subtreeFlags&2064)===0&&(t.flags&2064)===0||yu||(yu=!0,hf(Mu,function(){return Sr(),null})),u=(t.flags&15990)!==0,(t.subtreeFlags&15990)!==0||u){u=sn.transition,sn.transition=null;var a=Q;Q=1;var i=V;V|=4,Ys.current=null,Jg(e,t),uf(t,e),Tg(Zi),Lu=!!Qi,Zi=Qi=null,e.current=t,e2(t,e,o),Rh(),V=i,Q=a,sn.transition=u}else e.current=t;if(yu&&(yu=!1,ft=e,Ku=o),u=e.pendingLanes,u===0&&(bt=null),Ph(t.stateNode,r),Ve(e,ae()),n!==null)for(r=e.onRecoverableError,t=0;t<n.length;t++)o=n[t],r(o.value,{componentStack:o.stack,digest:o.digest});if(Yu)throw Yu=!1,e=ms,ms=null,e;return(Ku&1)!==0&&e.tag!==0&&Sr(),u=e.pendingLanes,(u&1)!==0?e===hs?ho++:(ho=0,hs=e):ho=0,Et(),null}function Sr(){if(ft!==null){var e=$d(Ku),n=sn.transition,t=Q;try{if(sn.transition=null,Q=16>e?16:e,ft===null)var r=!1;else{if(e=ft,ft=null,Ku=0,(V&6)!==0)throw Error(E(331));var o=V;for(V|=4,F=e.current;F!==null;){var u=F,a=u.child;if((F.flags&16)!==0){var i=u.deletions;if(i!==null){for(var s=0;s<i.length;s++){var l=i[s];for(F=l;F!==null;){var f=F;switch(f.tag){case 0:case 11:case 15:fo(8,f,u)}var m=f.child;if(m!==null)m.return=f,F=m;else for(;F!==null;){f=F;var g=f.sibling,v=f.return;if(tf(f),f===l){F=null;break}if(g!==null){g.return=v,F=g;break}F=v}}}var x=u.alternate;if(x!==null){var w=x.child;if(w!==null){x.child=null;do{var C=w.sibling;w.sibling=null,w=C}while(w!==null)}}F=u}}if((u.subtreeFlags&2064)!==0&&a!==null)a.return=u,F=a;else e:for(;F!==null;){if(u=F,(u.flags&2048)!==0)switch(u.tag){case 0:case 11:case 15:fo(9,u,u.return)}var h=u.sibling;if(h!==null){h.return=u.return,F=h;break e}F=u.return}}var d=e.current;for(F=d;F!==null;){a=F;var c=a.child;if((a.subtreeFlags&2064)!==0&&c!==null)c.return=a,F=c;else e:for(a=d;F!==null;){if(i=F,(i.flags&2048)!==0)try{switch(i.tag){case 0:case 11:case 15:la(9,i)}}catch(b){oe(i,i.return,b)}if(i===a){F=null;break e}var p=i.sibling;if(p!==null){p.return=i.return,F=p;break e}F=i.return}}if(V=o,Et(),An&&typeof An.onPostCommitFiberRoot=="function")try{An.onPostCommitFiberRoot(na,e)}catch{}r=!0}return r}finally{Q=t,sn.transition=n}}return!1}function vd(e,n,t){n=Nr(t,n),n=$p(e,n,1),e=vt(e,n,1),n=Ie(),e!==null&&(Io(e,1,n),Ve(e,n))}function oe(e,n,t){if(e.tag===3)vd(e,e,t);else for(;n!==null;){if(n.tag===3){vd(n,e,t);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(bt===null||!bt.has(r))){e=Nr(t,e),e=Wp(n,e,1),n=vt(n,e,1),e=Ie(),n!==null&&(Io(n,1,e),Ve(n,e));break}}n=n.return}}function a2(e,n,t){var r=e.pingCache;r!==null&&r.delete(n),n=Ie(),e.pingedLanes|=e.suspendedLanes&t,me===e&&(be&t)===t&&(le===4||le===3&&(be&130023424)===be&&500>ae()-Js?Bt(e,0):Ks|=t),Ve(e,n)}function ff(e,n){n===0&&((e.mode&1)===0?n=1:(n=au,au<<=1,(au&130023424)===0&&(au=4194304)));var t=Ie();e=Xn(e,n),e!==null&&(Io(e,n,t),Ve(e,t))}function i2(e){var n=e.memoizedState,t=0;n!==null&&(t=n.retryLane),ff(e,t)}function s2(e,n){var t=0;switch(e.tag){case 13:var r=e.stateNode,o=e.memoizedState;o!==null&&(t=o.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(E(314))}r!==null&&r.delete(n),ff(e,t)}var mf;mf=function(e,n,t){if(e!==null)if(e.memoizedProps!==n.pendingProps||qe.current)je=!0;else{if((e.lanes&t)===0&&(n.flags&128)===0)return je=!1,Gg(e,n,t);je=(e.flags&131072)!==0}else je=!1,ee&&(n.flags&1048576)!==0&&xp(n,Hu,n.index);switch(n.lanes=0,n.tag){case 2:var r=n.type;Tu(e,n),e=n.pendingProps;var o=Tr(n,De.current);_r(n,t),o=Ws(null,n,r,e,o,t);var u=Qs();return n.flags|=1,typeof o=="object"&&o!==null&&typeof o.render=="function"&&o.$$typeof===void 0?(n.tag=1,n.memoizedState=null,n.updateQueue=null,He(r)?(u=!0,ju(n)):u=!1,n.memoizedState=o.state!==null&&o.state!==void 0?o.state:null,js(n),o.updater=sa,n.stateNode=o,o._reactInternals=n,rs(n,r,e,t),n=as(null,n,r,!0,u,t)):(n.tag=0,ee&&u&&Ms(n),Re(null,n,o,t),n=n.child),n;case 16:r=n.elementType;e:{switch(Tu(e,n),e=n.pendingProps,o=r._init,r=o(r._payload),n.type=r,o=n.tag=c2(r),e=hn(r,e),o){case 0:n=us(null,n,r,e,t);break e;case 1:n=sd(null,n,r,e,t);break e;case 11:n=ad(null,n,r,e,t);break e;case 14:n=id(null,n,r,hn(r.type,e),t);break e}throw Error(E(306,r,""))}return n;case 0:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:hn(r,o),us(e,n,r,o,t);case 1:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:hn(r,o),sd(e,n,r,o,t);case 3:e:{if(Xp(n),e===null)throw Error(E(387));r=n.pendingProps,u=n.memoizedState,o=u.element,Cp(e,n),Wu(n,r,null,t);var a=n.memoizedState;if(r=a.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:a.cache,pendingSuspenseBoundaries:a.pendingSuspenseBoundaries,transitions:a.transitions},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){o=Nr(Error(E(423)),n),n=ld(e,n,r,t,o);break e}else if(r!==o){o=Nr(Error(E(424)),n),n=ld(e,n,r,t,o);break e}else for(Ze=xt(n.stateNode.containerInfo.firstChild),Ge=n,ee=!0,xn=null,t=wp(n,null,r,t),n.child=t;t;)t.flags=t.flags&-3|4096,t=t.sibling;else{if(Ar(),r===o){n=Yn(e,n,t);break e}Re(e,n,r,t)}n=n.child}return n;case 5:return _p(n),e===null&&es(n),r=n.type,o=n.pendingProps,u=e!==null?e.memoizedProps:null,a=o.children,Gi(r,o)?a=null:u!==null&&Gi(r,u)&&(n.flags|=32),Gp(e,n),Re(e,n,a,t),n.child;case 6:return e===null&&es(n),null;case 13:return Yp(e,n,t);case 4:return qs(n,n.stateNode.containerInfo),r=n.pendingProps,e===null?n.child=Dr(n,null,r,t):Re(e,n,r,t),n.child;case 11:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:hn(r,o),ad(e,n,r,o,t);case 7:return Re(e,n,n.pendingProps,t),n.child;case 8:return Re(e,n,n.pendingProps.children,t),n.child;case 12:return Re(e,n,n.pendingProps.children,t),n.child;case 10:e:{if(r=n.type._context,o=n.pendingProps,u=n.memoizedProps,a=o.value,Y(Vu,r._currentValue),r._currentValue=a,u!==null)if(yn(u.value,a)){if(u.children===o.children&&!qe.current){n=Yn(e,n,t);break e}}else for(u=n.child,u!==null&&(u.return=n);u!==null;){var i=u.dependencies;if(i!==null){a=u.child;for(var s=i.firstContext;s!==null;){if(s.context===r){if(u.tag===1){s=Qn(-1,t&-t),s.tag=2;var l=u.updateQueue;if(l!==null){l=l.shared;var f=l.pending;f===null?s.next=s:(s.next=f.next,f.next=s),l.pending=s}}u.lanes|=t,s=u.alternate,s!==null&&(s.lanes|=t),ns(u.return,t,n),i.lanes|=t;break}s=s.next}}else if(u.tag===10)a=u.type===n.type?null:u.child;else if(u.tag===18){if(a=u.return,a===null)throw Error(E(341));a.lanes|=t,i=a.alternate,i!==null&&(i.lanes|=t),ns(a,t,n),a=u.sibling}else a=u.child;if(a!==null)a.return=u;else for(a=u;a!==null;){if(a===n){a=null;break}if(u=a.sibling,u!==null){u.return=a.return,a=u;break}a=a.return}u=a}Re(e,n,o.children,t),n=n.child}return n;case 9:return o=n.type,r=n.pendingProps.children,_r(n,t),o=ln(o),r=r(o),n.flags|=1,Re(e,n,r,t),n.child;case 14:return r=n.type,o=hn(r,n.pendingProps),o=hn(r.type,o),id(e,n,r,o,t);case 15:return Qp(e,n,n.type,n.pendingProps,t);case 17:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:hn(r,o),Tu(e,n),n.tag=1,He(r)?(e=!0,ju(n)):e=!1,_r(n,t),Vp(n,r,o),rs(n,r,o,t),as(null,n,r,!0,e,t);case 19:return Kp(e,n,t);case 22:return Zp(e,n,t)}throw Error(E(156,n.tag))};function hf(e,n){return jd(e,n)}function l2(e,n,t,r){this.tag=e,this.key=t,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function an(e,n,t,r){return new l2(e,n,t,r)}function rl(e){return e=e.prototype,!(!e||!e.isReactComponent)}function c2(e){if(typeof e=="function")return rl(e)?1:0;if(e!=null){if(e=e.$$typeof,e===ks)return 11;if(e===Cs)return 14}return 2}function wt(e,n){var t=e.alternate;return t===null?(t=an(e.tag,n,e.key,e.mode),t.elementType=e.elementType,t.type=e.type,t.stateNode=e.stateNode,t.alternate=e,e.alternate=t):(t.pendingProps=n,t.type=e.type,t.flags=0,t.subtreeFlags=0,t.deletions=null),t.flags=e.flags&14680064,t.childLanes=e.childLanes,t.lanes=e.lanes,t.child=e.child,t.memoizedProps=e.memoizedProps,t.memoizedState=e.memoizedState,t.updateQueue=e.updateQueue,n=e.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},t.sibling=e.sibling,t.index=e.index,t.ref=e.ref,t}function Fu(e,n,t,r,o,u){var a=2;if(r=e,typeof e=="function")rl(e)&&(a=1);else if(typeof e=="string")a=5;else e:switch(e){case lr:return Ut(t.children,o,u,n);case ws:a=8,o|=8;break;case Ti:return e=an(12,t,n,o|2),e.elementType=Ti,e.lanes=u,e;case Ai:return e=an(13,t,n,o),e.elementType=Ai,e.lanes=u,e;case Di:return e=an(19,t,n,o),e.elementType=Di,e.lanes=u,e;case _d:return da(t,o,u,n);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case kd:a=10;break e;case Cd:a=9;break e;case ks:a=11;break e;case Cs:a=14;break e;case st:a=16,r=null;break e}throw Error(E(130,e==null?e:typeof e,""))}return n=an(a,t,n,o),n.elementType=e,n.type=r,n.lanes=u,n}function Ut(e,n,t,r){return e=an(7,e,r,n),e.lanes=t,e}function da(e,n,t,r){return e=an(22,e,r,n),e.elementType=_d,e.lanes=t,e.stateNode={isHidden:!1},e}function _i(e,n,t){return e=an(6,e,null,n),e.lanes=t,e}function Si(e,n,t){return n=an(4,e.children!==null?e.children:[],e.key,n),n.lanes=t,n.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},n}function d2(e,n,t,r,o){this.tag=n,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=si(0),this.expirationTimes=si(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=si(0),this.identifierPrefix=r,this.onRecoverableError=o,this.mutableSourceEagerHydrationData=null}function ol(e,n,t,r,o,u,a,i,s){return e=new d2(e,n,t,i,s),n===1?(n=1,u===!0&&(n|=8)):n=0,u=an(3,null,null,n),e.current=u,u.stateNode=e,u.memoizedState={element:r,isDehydrated:t,cache:null,transitions:null,pendingSuspenseBoundaries:null},js(u),e}function p2(e,n,t){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:sr,key:r==null?null:""+r,children:e,containerInfo:n,implementation:t}}function gf(e){if(!e)return Ct;e=e._reactInternals;e:{if(Qt(e)!==e||e.tag!==1)throw Error(E(170));var n=e;do{switch(n.tag){case 3:n=n.stateNode.context;break e;case 1:if(He(n.type)){n=n.stateNode.__reactInternalMemoizedMergedChildContext;break e}}n=n.return}while(n!==null);throw Error(E(171))}if(e.tag===1){var t=e.type;if(He(t))return hp(e,t,n)}return n}function xf(e,n,t,r,o,u,a,i,s){return e=ol(t,r,!0,e,o,u,a,i,s),e.context=gf(null),t=e.current,r=Ie(),o=yt(t),u=Qn(r,o),u.callback=n??null,vt(t,u,o),e.current.lanes=o,Io(e,o,r),Ve(e,r),e}function pa(e,n,t,r){var o=n.current,u=Ie(),a=yt(o);return t=gf(t),n.context===null?n.context=t:n.pendingContext=t,n=Qn(u,a),n.payload={element:e},r=r===void 0?null:r,r!==null&&(n.callback=r),e=vt(o,n,a),e!==null&&(bn(e,o,a,u),_u(e,o,a)),a}function ea(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function bd(e,n){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var t=e.retryLane;e.retryLane=t!==0&&t<n?t:n}}function ul(e,n){bd(e,n),(e=e.alternate)&&bd(e,n)}function f2(){return null}var vf=typeof reportError=="function"?reportError:function(e){console.error(e)};function al(e){this._internalRoot=e}fa.prototype.render=al.prototype.render=function(e){var n=this._internalRoot;if(n===null)throw Error(E(409));pa(e,n,null,null)};fa.prototype.unmount=al.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var n=e.containerInfo;$t(function(){pa(null,e,null,null)}),n[Gn]=null}};function fa(e){this._internalRoot=e}fa.prototype.unstable_scheduleHydration=function(e){if(e){var n=Zd();e={blockedOn:null,target:e,priority:n};for(var t=0;t<ct.length&&n!==0&&n<ct[t].priority;t++);ct.splice(t,0,e),t===0&&Xd(e)}};function il(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function ma(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function yd(){}function m2(e,n,t,r,o){if(o){if(typeof r=="function"){var u=r;r=function(){var l=ea(a);u.call(l)}}var a=xf(n,r,e,0,null,!1,!1,"",yd);return e._reactRootContainer=a,e[Gn]=a.current,_o(e.nodeType===8?e.parentNode:e),$t(),a}for(;o=e.lastChild;)e.removeChild(o);if(typeof r=="function"){var i=r;r=function(){var l=ea(s);i.call(l)}}var s=ol(e,0,!1,null,null,!1,!1,"",yd);return e._reactRootContainer=s,e[Gn]=s.current,_o(e.nodeType===8?e.parentNode:e),$t(function(){pa(n,s,t,r)}),s}function ha(e,n,t,r,o){var u=t._reactRootContainer;if(u){var a=u;if(typeof o=="function"){var i=o;o=function(){var s=ea(a);i.call(s)}}pa(n,a,e,o)}else a=m2(t,n,e,o,r);return ea(a)}Wd=function(e){switch(e.tag){case 3:var n=e.stateNode;if(n.current.memoizedState.isDehydrated){var t=oo(n.pendingLanes);t!==0&&(Es(n,t|1),Ve(n,ae()),(V&6)===0&&(Rr=ae()+500,Et()))}break;case 13:$t(function(){var r=Xn(e,1);if(r!==null){var o=Ie();bn(r,e,1,o)}}),ul(e,1)}};Ts=function(e){if(e.tag===13){var n=Xn(e,134217728);if(n!==null){var t=Ie();bn(n,e,134217728,t)}ul(e,134217728)}};Qd=function(e){if(e.tag===13){var n=yt(e),t=Xn(e,n);if(t!==null){var r=Ie();bn(t,e,n,r)}ul(e,n)}};Zd=function(){return Q};Gd=function(e,n){var t=Q;try{return Q=e,n()}finally{Q=t}};Bi=function(e,n,t){switch(n){case"input":if(Ri(e,t),n=t.name,t.type==="radio"&&n!=null){for(t=e;t.parentNode;)t=t.parentNode;for(t=t.querySelectorAll("input[name="+JSON.stringify(""+n)+'][type="radio"]'),n=0;n<t.length;n++){var r=t[n];if(r!==e&&r.form===e.form){var o=ua(r);if(!o)throw Error(E(90));Ed(r),Ri(r,o)}}}break;case"textarea":Ad(e,t);break;case"select":n=t.value,n!=null&&yr(e,!!t.multiple,n,!1)}};Pd=el;Ld=$t;var h2={usingClientEntryPoint:!1,Events:[Po,fr,ua,Id,Md,el]},eo={findFiberByHostInstance:Lt,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},g2={bundleType:eo.bundleType,version:eo.version,rendererPackageName:eo.rendererPackageName,rendererConfig:eo.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Kn.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Bd(e),e===null?null:e.stateNode},findFiberByHostInstance:eo.findFiberByHostInstance||f2,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(no=__REACT_DEVTOOLS_GLOBAL_HOOK__,!no.isDisabled&&no.supportsFiber))try{na=no.inject(g2),An=no}catch{}var no;Ke.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=h2;Ke.createPortal=function(e,n){var t=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!il(n))throw Error(E(200));return p2(e,n,null,t)};Ke.createRoot=function(e,n){if(!il(e))throw Error(E(299));var t=!1,r="",o=vf;return n!=null&&(n.unstable_strictMode===!0&&(t=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),n=ol(e,1,!1,null,null,t,!1,r,o),e[Gn]=n.current,_o(e.nodeType===8?e.parentNode:e),new al(n)};Ke.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var n=e._reactInternals;if(n===void 0)throw typeof e.render=="function"?Error(E(188)):(e=Object.keys(e).join(","),Error(E(268,e)));return e=Bd(n),e=e===null?null:e.stateNode,e};Ke.flushSync=function(e){return $t(e)};Ke.hydrate=function(e,n,t){if(!ma(n))throw Error(E(200));return ha(null,e,n,!0,t)};Ke.hydrateRoot=function(e,n,t){if(!il(e))throw Error(E(405));var r=t!=null&&t.hydratedSources||null,o=!1,u="",a=vf;if(t!=null&&(t.unstable_strictMode===!0&&(o=!0),t.identifierPrefix!==void 0&&(u=t.identifierPrefix),t.onRecoverableError!==void 0&&(a=t.onRecoverableError)),n=xf(n,null,e,1,t??null,o,!1,u,a),e[Gn]=n.current,_o(e),r)for(e=0;e<r.length;e++)t=r[e],o=t._getVersion,o=o(t._source),n.mutableSourceEagerHydrationData==null?n.mutableSourceEagerHydrationData=[t,o]:n.mutableSourceEagerHydrationData.push(t,o);return new fa(n)};Ke.render=function(e,n,t){if(!ma(n))throw Error(E(200));return ha(null,e,n,!1,t)};Ke.unmountComponentAtNode=function(e){if(!ma(e))throw Error(E(40));return e._reactRootContainer?($t(function(){ha(null,null,e,!1,function(){e._reactRootContainer=null,e[Gn]=null})}),!0):!1};Ke.unstable_batchedUpdates=el;Ke.unstable_renderSubtreeIntoContainer=function(e,n,t,r){if(!ma(t))throw Error(E(200));if(e==null||e._reactInternals===void 0)throw Error(E(38));return ha(e,n,t,!1,r)};Ke.version="18.3.1-next-f1338f8080-20240426"});var kf=qn((Lv,wf)=>{"use strict";function yf(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(yf)}catch(e){console.error(e)}}yf(),wf.exports=bf()});var _f=qn(sl=>{"use strict";var Cf=kf();sl.createRoot=Cf.createRoot,sl.hydrateRoot=Cf.hydrateRoot;var zv});var Mf=qn(xa=>{"use strict";var b2=xe(),y2=Symbol.for("react.element"),w2=Symbol.for("react.fragment"),k2=Object.prototype.hasOwnProperty,C2=b2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,_2={key:!0,ref:!0,__self:!0,__source:!0};function If(e,n,t){var r,o={},u=null,a=null;t!==void 0&&(u=""+t),n.key!==void 0&&(u=""+n.key),n.ref!==void 0&&(a=n.ref);for(r in n)k2.call(n,r)&&!_2.hasOwnProperty(r)&&(o[r]=n[r]);if(e&&e.defaultProps)for(r in n=e.defaultProps,n)o[r]===void 0&&(o[r]=n[r]);return{$$typeof:y2,type:e,key:u,ref:a,props:o,_owner:C2.current}}xa.Fragment=w2;xa.jsx=If;xa.jsxs=If});var D=qn((Xv,Pf)=>{"use strict";Pf.exports=Mf()});var z1=A(_f(),1);var U=A(xe(),1);var Pr=null;function x2(){return Pr||(typeof acquireVsCodeApi<"u"?(Pr=acquireVsCodeApi(),Pr):(Pr={postMessage:e=>{console.log("Mock postMessage:",e)},getState:()=>({}),setState:e=>{console.log("Mock setState:",e)}},Pr))}function Fn(){return x2()}var ce=A(xe(),1);var Sf=e=>{let[n,t]=(0,ce.useState)([]),[r,o]=(0,ce.useState)(null),[u,a]=(0,ce.useState)("Past Conversations"),[i,s]=(0,ce.useState)(!1),[l,f]=(0,ce.useState)(""),[m,g]=(0,ce.useState)([]),[v,x]=(0,ce.useState)(void 0),[w,C]=(0,ce.useState)(!0),[h,d]=(0,ce.useState)(!1),c=20,p=(0,ce.useMemo)(()=>{if(!l.trim())return n;let N=l.toLowerCase();return n.filter(P=>(P.title||P.name||"").toLowerCase().includes(N))},[n,l]),b=(0,ce.useCallback)(()=>{t([]),x(void 0),C(!0),d(!0),e.postMessage({type:"getQwenSessions",data:{size:c}}),s(!0)},[e]),y=(0,ce.useCallback)(()=>{!w||h||v===void 0||(d(!0),e.postMessage({type:"getQwenSessions",data:{cursor:v,size:c}}))},[w,h,v,e]),k=(0,ce.useCallback)(()=>{e.postMessage({type:"openNewChatTab",data:{}}),s(!1)},[e]),_=(0,ce.useCallback)(N=>{if(N===r){console.log("[useSessionManagement] Already on this session, ignoring"),s(!1);return}console.log("[useSessionManagement] Switching to session:",N),e.postMessage({type:"switchQwenSession",data:{sessionId:N}})},[r,e]),T=(0,ce.useCallback)(N=>{e.postMessage({type:"saveSession",data:{tag:N}})},[e]),S=(0,ce.useCallback)(N=>{if(N.success){if(N.message){let P=N.message.match(/tag: (.+)$/);P&&g(tn=>[...tn,P[1]])}}else console.error("Failed to save session:",N.message)},[]);return{qwenSessions:n,currentSessionId:r,currentSessionTitle:u,showSessionSelector:i,sessionSearchQuery:l,filteredSessions:p,savedSessionTags:m,nextCursor:v,hasMore:w,isLoading:h,setQwenSessions:t,setCurrentSessionId:o,setCurrentSessionTitle:a,setShowSessionSelector:s,setSessionSearchQuery:f,setSavedSessionTags:g,setNextCursor:x,setHasMore:C,setIsLoading:d,handleLoadQwenSessions:b,handleNewQwenSession:k,handleSwitchSession:_,handleSaveSession:T,handleSaveSessionResponse:S,handleLoadMoreSessions:y}};var we=A(xe(),1);var Ef=e=>{let[n,t]=(0,we.useState)(null),[r,o]=(0,we.useState)(null),[u,a]=(0,we.useState)(null),[i,s]=(0,we.useState)([]),l=(0,we.useRef)(new Map),f=(0,we.useRef)(!1),m=(0,we.useRef)(void 0),g=(0,we.useRef)(null),v=(0,we.useCallback)(c=>{let p=c?.trim();p&&p.length>=1?(g.current&&clearTimeout(g.current),g.current=setTimeout(()=>{e.postMessage({type:"getWorkspaceFiles",data:{query:p}})},300),m.current=p):(!f.current||m.current!==void 0)&&(m.current=void 0,f.current=!0,e.postMessage({type:"getWorkspaceFiles",data:{}}))},[e]),x=(0,we.useCallback)((c,p)=>{l.current.set(c,p)},[]),w=(0,we.useCallback)(c=>l.current.get(c),[]),C=(0,we.useCallback)(()=>{l.current.clear()},[]),h=(0,we.useCallback)(()=>{e.postMessage({type:"getActiveEditor",data:{}})},[e]),d=(0,we.useCallback)(()=>{e.postMessage({type:"focusActiveEditor",data:{}})},[e]);return{activeFileName:n,activeFilePath:r,activeSelection:u,workspaceFiles:i,hasRequestedFiles:f.current,setActiveFileName:t,setActiveFilePath:o,setActiveSelection:a,setWorkspaceFiles:s,addFileReference:x,getFileReference:w,clearFileReferences:C,requestWorkspaceFiles:v,requestActiveEditor:h,focusActiveEditor:d}};var ke=A(xe(),1);var Tf=()=>{let[e,n]=(0,ke.useState)([]),[t,r]=(0,ke.useState)(!1),[o,u]=(0,ke.useState)(!1),[a,i]=(0,ke.useState)(""),s=(0,ke.useRef)(null),l=(0,ke.useRef)(null),f=(0,ke.useCallback)(d=>{n(c=>[...c,d])},[]),m=(0,ke.useCallback)(()=>{n([])},[]),g=(0,ke.useCallback)(d=>{n(c=>(s.current=c.length,[...c,{role:"assistant",content:"",timestamp:typeof d=="number"?d:Date.now()}])),r(!0)},[]),v=(0,ke.useCallback)(d=>{t&&n(c=>{let p=s.current,b=c.slice();if(p===null&&(p=b.length,s.current=p,b.push({role:"assistant",content:"",timestamp:Date.now()})),p<0||p>=b.length)return c;let y=b[p];return b[p]={...y,content:(y.content||"")+d},b})},[t]),x=(0,ke.useCallback)(()=>{s.current=null},[]),w=(0,ke.useCallback)(()=>{r(!1),s.current=null,n(d=>{let c=l.current;if(l.current=null,c===null||c<0||c>=d.length)return d;let p=d.slice();return p.splice(c,1),p})},[]),C=(0,ke.useCallback)(d=>{u(!0),i(d)},[]),h=(0,ke.useCallback)(()=>{u(!1),i("")},[]);return{messages:e,isStreaming:t,isWaitingForResponse:o,loadingMessage:a,addMessage:f,clearMessages:m,startStreaming:g,appendStreamChunk:v,endStreaming:w,appendThinkingChunk:d=>{t&&n(c=>{let p=l.current,b=c.slice();if(p===null&&(p=b.length,l.current=p,b.push({role:"thinking",content:"",timestamp:Date.now()})),p>=0&&p<b.length){let y=b[p];b[p]={...y,content:(y.content||"")+d}}return b})},clearThinking:()=>{n(d=>{let c=l.current;if(l.current=null,c===null||c<0||c>=d.length)return d;let p=d.slice();return p.splice(c,1),p})},breakAssistantSegment:x,setWaitingForResponse:C,clearWaitingForResponse:h,setMessages:n}};var zo=A(xe(),1);var Af=()=>{let[e,n]=(0,zo.useState)(new Map),t=(0,zo.useCallback)(a=>{n(i=>{let s=new Map(i),l=s.get(a.toolCallId),f=h=>(h||"").toLowerCase()==="todo_write"||(h||"").toLowerCase()==="todowrite"||(h||"").toLowerCase()==="update_todos",m=h=>typeof h=="string"?h.trim().toLowerCase():"",g=h=>{let d=m(h);return d==="updated plan"||d==="update todos"},v=h=>{if(!h||h.length===0)return"";let d=[];for(let c of h)c.type==="content"&&c.content?.text&&d.push(String(c.content.text));return d.join(`
`)},x=h=>h?h.split(/\r?\n/).map(c=>c.trim()).filter(Boolean).map(c=>{let p=c.indexOf("] ");return p>=0?c.slice(p+2).trim():c}):[],w=(h,d)=>{let c=x(h),p=x(d);if(c.length===p.length&&c.every((_,T)=>_===p[T]))return{same:!0,supplement:!1};let b=new Set(p);return{same:!1,supplement:c.every(k=>b.has(k))}},C=h=>typeof h=="string"?h:h&&typeof h=="object"?JSON.stringify(h):"Tool Call";if(a.type==="tool_call"){let h=a.content?.map(d=>({type:d.type,content:d.content,path:d.path,oldText:d.oldText,newText:d.newText}));if(f(a.kind)&&g(a.title)){let d=v(h),c=null,p="",b=0;for(let y of s.values())f(y.kind)&&g(y.title)&&typeof y.timestamp=="number"&&y.timestamp>=b&&(c=y.toolCallId,p=v(y.content),b=y.timestamp||0);if(c){let y=w(p,d);if(y.same)return s;if(y.supplement){let k=s.get(c);if(k)return s.set(c,{...k,content:h,status:a.status||k.status,timestamp:a.timestamp||Date.now()}),s}}}s.set(a.toolCallId,{toolCallId:a.toolCallId,kind:a.kind||"other",title:C(a.title),status:a.status||"pending",rawInput:a.rawInput,content:h,locations:a.locations,timestamp:a.timestamp||Date.now()})}else if(a.type==="tool_call_update"){let h=a.content?a.content.map(d=>({type:d.type,content:d.content,path:d.path,oldText:d.oldText,newText:d.newText})):void 0;if(l){let d=l.content;h&&(f(a.kind||l.kind)&&(g(a.title)||g(l.title))?d=h:d=[...l.content||[],...h]);let p=a.status==="completed"||a.status==="failed"?Date.now():a.timestamp||l.timestamp||Date.now();s.set(a.toolCallId,{...l,...a.kind&&{kind:a.kind},...a.title&&{title:C(a.title)},...a.status&&{status:a.status},content:d,...a.locations&&{locations:a.locations},timestamp:p})}else s.set(a.toolCallId,{toolCallId:a.toolCallId,kind:a.kind||"other",title:a.title?C(a.title):"",status:a.status||"pending",rawInput:a.rawInput,content:h,locations:a.locations,timestamp:a.timestamp||Date.now()})}return s})},[]),r=(0,zo.useCallback)(()=>{n(new Map)},[]),o=Array.from(e.values()).filter(a=>a.status==="pending"||a.status==="in_progress"),u=Array.from(e.values()).filter(a=>a.status==="completed"||a.status==="failed");return{toolCalls:e,inProgressToolCalls:o,completedToolCalls:u,handleToolCallUpdate:t,clearToolCalls:r}};var Jn=A(xe(),1);var v2=new Set(["user_cancelled","cancelled","timeout","error","session_expired"]),Df=({sessionManagement:e,fileContext:n,messageHandling:t,handleToolCallUpdate:r,clearToolCalls:o,setPlanEntries:u,handlePermissionRequest:a,inputFieldRef:i,setInputText:s,setEditMode:l,setIsAuthenticated:f})=>{let m=Fn(),g=(0,Jn.useRef)(new Set),v=(0,Jn.useRef)({sessionManagement:e,fileContext:n,messageHandling:t,handleToolCallUpdate:r,clearToolCalls:o,setPlanEntries:u,handlePermissionRequest:a,setIsAuthenticated:f}),x=(0,Jn.useRef)(null),w=d=>d.map(c=>`- [${c.status==="completed"?"x":c.status==="in_progress"?"-":" "}] ${c.content}`.trim()),C=(d,c)=>{let p=y=>{let k=y.indexOf("] ");return k>=0?y.slice(k+2).trim():y.trim()},b=new Set(c.map(p));for(let y of d)if(!b.has(p(y)))return!1;return!0};(0,Jn.useEffect)(()=>{v.current={sessionManagement:e,fileContext:n,messageHandling:t,handleToolCallUpdate:r,clearToolCalls:o,setPlanEntries:u,handlePermissionRequest:a,setIsAuthenticated:f}});let h=(0,Jn.useCallback)(d=>{let c=d.data,p=v.current;switch(c.type){case"modeInfo":{try{let b=c.data?.currentModeId||"default";l?.(b)}catch{}break}case"modeChanged":{try{let b=c.data?.modeId||"default";l?.(b)}catch{}break}case"loginSuccess":{p.messageHandling.clearWaitingForResponse(),p.messageHandling.addMessage({role:"assistant",content:"Successfully logged in. You can continue chatting.",timestamp:Date.now()}),p.setIsAuthenticated?.(!0);break}case"agentConnected":{p.messageHandling.clearWaitingForResponse(),p.setIsAuthenticated?.(!0);break}case"agentConnectionError":{p.messageHandling.clearWaitingForResponse();let b=c?.data?.message||"Failed to connect to Qwen agent.";p.messageHandling.addMessage({role:"assistant",content:`Failed to connect to Qwen agent: ${b}
You can still use the chat UI, but messages won't be sent to AI.`,timestamp:Date.now()}),p.setIsAuthenticated?.(!1);break}case"loginError":{p.messageHandling.clearWaitingForResponse();let b=c?.data?.message||"Login failed. Please try again.";p.messageHandling.addMessage({role:"assistant",content:b,timestamp:Date.now()}),p.setIsAuthenticated?.(!1);break}case"authState":{let b=c?.data?.authenticated;typeof b=="boolean"?p.setIsAuthenticated?.(b):p.setIsAuthenticated?.(null);break}case"conversationLoaded":{let b=c.data;p.messageHandling.setMessages(b.messages);break}case"message":{let b=c.data;if(p.messageHandling.addMessage(b),b.role==="assistant"){try{p.messageHandling.endStreaming()}catch(y){console.warn("[PanelManager] Failed to end streaming:",y)}if(g.current.size===0)try{p.messageHandling.clearWaitingForResponse()}catch(y){console.warn("[PanelManager] Failed to clear waiting for response:",y)}}break}case"streamStart":p.messageHandling.startStreaming(c.data?.timestamp);break;case"streamChunk":{p.messageHandling.appendStreamChunk(c.data.chunk);break}case"thoughtChunk":{let b=c.data.content||c.data.chunk||"";p.messageHandling.appendThinkingChunk(b);break}case"streamEnd":{p.messageHandling.endStreaming(),p.messageHandling.clearThinking();try{let b=(c.data?.reason||"").toLowerCase();if(v2.has(b)){g.current.clear(),p.messageHandling.clearWaitingForResponse();break}}catch{}g.current.size===0&&p.messageHandling.clearWaitingForResponse();break}case"error":p.messageHandling.endStreaming(),p.messageHandling.clearThinking(),g.current.clear(),p.messageHandling.clearWaitingForResponse();break;case"permissionRequest":{p.handlePermissionRequest(c.data);let b=c.data?.toolCall;if(b?.toolCallId){let y=b.kind||"execute",k=b.content||[];if(Array.isArray(k)?k.some(S=>!!S&&typeof S=="object"&&S.type==="diff"):!1){y="edit";let S=k.find(N=>!!N&&typeof N=="object"&&N.type==="diff");S?.path&&S?.oldText!==void 0&&S?.newText!==void 0&&m.postMessage({type:"openDiff",data:{path:S.path,oldText:S.oldText,newText:S.newText}})}else if(b.title){let S=b.title.toLowerCase();S.includes("touch")||S.includes("echo")?y="execute":S.includes("read")||S.includes("cat")?y="read":(S.includes("write")||S.includes("edit"))&&(y="edit")}let T=b.status==="pending"||b.status==="in_progress"||b.status==="completed"||b.status==="failed"?b.status:"pending";p.handleToolCallUpdate({type:"tool_call",toolCallId:b.toolCallId,kind:y,title:b.title,status:T,content:b.content,locations:b.locations}),p.messageHandling.breakAssistantSegment()}break}case"permissionResolved":{try{p.handlePermissionRequest(null)}catch(b){console.warn("[useWebViewMessages] failed to close permission UI:",b)}break}case"plan":if(c.data.entries&&Array.isArray(c.data.entries)){let b=c.data.entries;p.setPlanEntries(b);let y=w(b),k=y.join(`
`),_=x.current;if(_&&_.text===k)break;try{let T=Date.now();if(_&&C(_.lines,y))p.handleToolCallUpdate({type:"tool_call_update",toolCallId:_.id,kind:"todo_write",title:"Updated Plan",status:"completed",content:[{type:"content",content:{type:"text",text:k}}],timestamp:T}),x.current={id:_.id,text:k,lines:y};else{let S=`plan-snapshot-${T}`;p.handleToolCallUpdate({type:"tool_call",toolCallId:S,kind:"todo_write",title:"Updated Plan",status:"completed",content:[{type:"content",content:{type:"text",text:k}}],timestamp:T}),x.current={id:S,text:k,lines:y}}p.messageHandling.breakAssistantSegment?.()}catch(T){console.warn("[useWebViewMessages] failed to push/merge plan snapshot toolcall:",T)}}break;case"toolCall":case"toolCallUpdate":{let b=c.data;b.sessionUpdate&&!b.type&&(b.type=b.sessionUpdate),p.handleToolCallUpdate(b);let y=(b.status||"").toString(),k=b.type==="tool_call",_=b.type==="tool_call_update"&&(y==="completed"||y==="failed");(k||_)&&p.messageHandling.breakAssistantSegment();try{let T=(b.toolCallId||"").toString(),S=(b.kind||"").toString().toLowerCase(),N=S==="execute"||S==="bash"||S==="command",P=g.current.has(T);if(!(N||P)||!T)break;if(y==="pending"||y==="in_progress"){if(N){g.current.add(T);let G=b.rawInput,We="";typeof G=="string"?We=G:G&&typeof G=="object"&&(We=G.command||"");let tr=We?`Running: ${We}`:"Running command...";p.messageHandling.setWaitingForResponse(tr)}}else(y==="completed"||y==="failed")&&g.current.delete(T);g.current.size===0&&p.messageHandling.clearWaitingForResponse()}catch{}break}case"qwenSessionList":{let b=c.data.sessions||[],y=!!c.data.append,k=c.data.nextCursor,_=!!c.data.hasMore;if(p.sessionManagement.setQwenSessions(T=>y?[...T,...b]:b),p.sessionManagement.setNextCursor(k),p.sessionManagement.setHasMore(_),p.sessionManagement.setIsLoading(!1),p.sessionManagement.currentSessionId&&b.length>0){let T=b.find(S=>S.id===p.sessionManagement.currentSessionId||S.sessionId===p.sessionManagement.currentSessionId);if(T){let S=T.title||T.name||"Past Conversations";p.sessionManagement.setCurrentSessionTitle(S)}}break}case"qwenSessionSwitched":if(p.sessionManagement.setShowSessionSelector(!1),c.data.sessionId&&p.sessionManagement.setCurrentSessionId(c.data.sessionId),c.data.session){let b=c.data.session,y=b.title||b.name||"Past Conversations";p.sessionManagement.setCurrentSessionTitle(y),m.postMessage({type:"updatePanelTitle",data:{title:y}})}c.data.messages?p.messageHandling.setMessages(c.data.messages):p.messageHandling.clearMessages(),p.messageHandling.clearWaitingForResponse(),g.current.clear(),p.clearToolCalls(),c.data.toolCalls&&Array.isArray(c.data.toolCalls)&&c.data.toolCalls.forEach(b=>{b&&typeof b=="object"&&p.handleToolCallUpdate(b)}),c.data.planEntries&&Array.isArray(c.data.planEntries)?p.setPlanEntries(c.data.planEntries):p.setPlanEntries([]),x.current=null;break;case"conversationCleared":p.messageHandling.clearMessages(),p.clearToolCalls(),p.sessionManagement.setCurrentSessionId(null),p.sessionManagement.setCurrentSessionTitle("Past Conversations"),m.postMessage({type:"updatePanelTitle",data:{title:"Qwen Code"}}),x.current=null;break;case"sessionTitleUpdated":{let b=c.data?.sessionId,y=c.data?.title;b&&y&&(p.sessionManagement.setCurrentSessionId(b),p.sessionManagement.setCurrentSessionTitle(y),m.postMessage({type:"updatePanelTitle",data:{title:y}}));break}case"activeEditorChanged":{let b=c.data?.fileName,y=c.data?.filePath,k=c.data?.selection;p.fileContext.setActiveFileName(b),p.fileContext.setActiveFilePath(y),p.fileContext.setActiveSelection(k);break}case"fileAttached":{let b=c.data;if(p.fileContext.addFileReference(b.name,b.value),i.current){let y=i.current.textContent||"",k=y?`${y} @${b.name} `:`@${b.name} `;i.current.textContent=k,s(k);let _=document.createRange(),T=window.getSelection();_.selectNodeContents(i.current),_.collapse(!1),T?.removeAllRanges(),T?.addRange(_)}break}case"workspaceFiles":{let b=c.data?.files;b&&(console.log("[WebView] Received workspaceFiles:",b.length),p.fileContext.setWorkspaceFiles(b));break}case"saveSessionResponse":{p.sessionManagement.handleSaveSessionResponse(c.data);break}case"cancelStreaming":p.messageHandling.endStreaming(),p.messageHandling.clearWaitingForResponse(),p.messageHandling.addMessage({role:"assistant",content:"Interrupted",timestamp:Date.now()});break;default:break}},[i,s,m,l]);(0,Jn.useEffect)(()=>(window.addEventListener("message",h),()=>window.removeEventListener("message",h)),[h])};var Nf=A(xe(),1);var ga=["I'm Feeling Lucky","Shipping awesomeness... ","Painting the serifs back on...","Navigating the slime mold...","Consulting the digital spirits...","Reticulating splines...","Warming up the AI hamsters...","Asking the magic conch shell...","Generating witty retort...","Polishing the algorithms...","Don't rush perfection (or my code)...","Brewing fresh bytes...","Counting electrons...","Engaging cognitive processors...","Checking for syntax errors in the universe...","One moment, optimizing humor...","Shuffling punchlines...","Untangling neural nets...","Compiling brilliance...","Loading wit.exe...","Summoning the cloud of wisdom...","Preparing a witty response...","Just a sec, I'm debugging reality...","Confuzzling the options...","Tuning the cosmic frequencies...","Crafting a response worthy of your patience...","Compiling the 1s and 0s...","Resolving dependencies... and existential crises...","Defragmenting memories... both RAM and personal...","Rebooting the humor module...","Caching the essentials (mostly cat memes)...","Optimizing for ludicrous speed","Swapping bits... don't tell the bytes...","Garbage collecting... be right back...","Assembling the interwebs...","Converting coffee into code...","Updating the syntax for reality...","Rewiring the synapses...","Looking for a misplaced semicolon...","Greasin' the cogs of the machine...","Pre-heating the servers...","Calibrating the flux capacitor...","Engaging the improbability drive...","Channeling the Force...","Aligning the stars for optimal response...","So say we all...","Loading the next great idea...","Just a moment, I'm in the zone...","Preparing to dazzle you with brilliance...","Just a tick, I'm polishing my wit...","Hold tight, I'm crafting a masterpiece...","Just a jiffy, I'm debugging the universe...","Just a moment, I'm aligning the pixels...","Just a sec, I'm optimizing the humor...","Just a moment, I'm tuning the algorithms...","Warp speed engaged...","Mining for more Dilithium crystals...","Don't panic...","Following the white rabbit...","The truth is in here... somewhere...","Blowing on the cartridge...","Loading... Do a barrel roll!","Waiting for the respawn...","Finishing the Kessel Run in less than 12 parsecs...","The cake is not a lie, it's just still loading...","Fiddling with the character creation screen...","Just a moment, I'm finding the right meme...","Pressing 'A' to continue...","Herding digital cats...","Polishing the pixels...","Finding a suitable loading screen pun...","Distracting you with this witty phrase...","Almost there... probably...","Our hamsters are working as fast as they can...","Giving Cloudy a pat on the head...","Petting the cat...","Rickrolling my boss...","Never gonna give you up, never gonna let you down...","Slapping the bass...","Tasting the snozberries...","I'm going the distance, I'm going for speed...","Is this the real life? Is this just fantasy?...","I've got a good feeling about this...","Poking the bear...","Doing research on the latest memes...","Figuring out how to make this more witty...","Hmmm... let me think...","What do you call a fish with no eyes? A fsh...","Why did the computer go to therapy? It had too many bytes...","Why don't programmers like nature? It has too many bugs...","Why do programmers prefer dark mode? Because light attracts bugs...","Why did the developer go broke? Because they used up all their cache...","What can you do with a broken pencil? Nothing, it's pointless...","Applying percussive maintenance...","Searching for the correct USB orientation...","Ensuring the magic smoke stays inside the wires...","Rewriting in Rust for no particular reason...","Trying to exit Vim...","Spinning up the hamster wheel...","That's not a bug, it's an undocumented feature...","Engage.","I'll be back... with an answer.","My other process is a TARDIS...","Communing with the machine spirit...","Letting the thoughts marinate...","Just remembered where I put my keys...","Pondering the orb...","I've seen things you people wouldn't believe... like a user who reads loading messages.","Initiating thoughtful gaze...","What's a computer's favorite snack? Microchips.","Why do Java developers wear glasses? Because they don't C#.","Charging the laser... pew pew!","Dividing by zero... just kidding!","Looking for an adult superviso... I mean, processing.","Making it go beep boop.","Buffering... because even AIs need a moment.","Entangling quantum particles for a faster response...","Polishing the chrome... on the algorithms.","Are you not entertained? (Working on it!)","Summoning the code gremlins... to help, of course.","Just waiting for the dial-up tone to finish...","Recalibrating the humor-o-meter.","My other loading screen is even funnier.","Pretty sure there's a cat walking on the keyboard somewhere...","Enhancing... Enhancing... Still loading.","It's not a bug, it's a feature... of this loading screen.","Have you tried turning it off and on again? (The loading screen, not me.)","Constructing additional pylons...","New line? That's Ctrl+J."],Ff=()=>ga[Math.floor(Math.random()*ga.length)];var Rf=({vscode:e,inputText:n,setInputText:t,inputFieldRef:r,isStreaming:o,isWaitingForResponse:u,skipAutoActiveContext:a=!1,fileContext:i,messageHandling:s})=>({handleSubmit:(0,Nf.useCallback)(f=>{if(f.preventDefault(),!n.trim()||o||u)return;if(n.trim()==="/login"){t(""),r.current&&(r.current.textContent="\u200B",r.current.setAttribute("data-empty","true")),e.postMessage({type:"login",data:{}});try{s.setWaitingForResponse("Logging in to Qwen Code...")}catch{}return}s.setWaitingForResponse(Ff());let m=[],g=/@([^\s]+)/g,v;for(;(v=g.exec(n))!==null;){let w=v[1],C=i.getFileReference(w);C&&m.push({type:"file",name:w,value:C})}if(i.activeFilePath&&!a){let w=i.activeFileName||"current file";m.push({type:"file",name:w,value:i.activeFilePath,startLine:i.activeSelection?.startLine,endLine:i.activeSelection?.endLine})}let x;i.activeFilePath&&i.activeFileName&&!a&&(x={fileName:i.activeFileName,filePath:i.activeFilePath,startLine:i.activeSelection?.startLine,endLine:i.activeSelection?.endLine}),e.postMessage({type:"sendMessage",data:{text:n,context:m.length>0?m:void 0,fileContext:x}}),t(""),r.current&&(r.current.textContent="\u200B",r.current.setAttribute("data-empty","true")),i.clearFileReferences()},[n,o,t,r,e,i,a,u,s])});var Nn=A(xe(),1),ue=A(D(),1);var Lf=({isOpen:e,options:n,toolCall:t,onResponse:r,onClose:o})=>{let[u,a]=(0,Nn.useState)(0),[i,s]=(0,Nn.useState)(""),l=(0,Nn.useRef)(null),f=(0,Nn.useRef)(null);console.log("PermissionDrawer rendered with isOpen:",e,t);let m=()=>{let v=t.locations?.[0]?.path;if(v)return v.split("/").pop()||v;let x=Array.isArray(t.content)?t.content.find(w=>typeof w=="object"&&w!==null&&"path"in w)?.path:void 0;return typeof x=="string"&&x.length>0?x.split("/").pop()||x:"file"},g=()=>{if(t.kind==="edit"||t.kind==="write"){let v=m();return(0,ue.jsxs)(ue.Fragment,{children:["Make this edit to"," ",(0,ue.jsx)("span",{className:"font-mono text-[var(--app-primary-foreground)]",children:v}),"?"]})}if(t.kind==="execute"||t.kind==="bash")return"Allow this bash command?";if(t.kind==="read"){let v=m();return(0,ue.jsxs)(ue.Fragment,{children:["Allow read from"," ",(0,ue.jsx)("span",{className:"font-mono text-[var(--app-primary-foreground)]",children:v}),"?"]})}return t.title||"Permission Required"};return(0,Nn.useEffect)(()=>{let v=x=>{if(!e)return;if(x.key.match(/^[1-9]$/)&&!f.current?.contains(document.activeElement)){let C=parseInt(x.key,10)-1;C<n.length&&(x.preventDefault(),r(n[C].optionId));return}if(x.key==="ArrowDown"||x.key==="ArrowUp"){x.preventDefault();let C=n.length+1;x.key==="ArrowDown"?a(h=>(h+1)%C):a(h=>(h-1+C)%C)}if(x.key==="Enter"&&!f.current?.contains(document.activeElement)&&(x.preventDefault(),u<n.length&&r(n[u].optionId)),x.key==="Escape"){x.preventDefault();let C=n.find(h=>h.kind.includes("reject"))?.optionId||n.find(h=>h.optionId==="cancel")?.optionId||"cancel";r(C),o&&o()}};return window.addEventListener("keydown",v),()=>window.removeEventListener("keydown",v)},[e,n,r,o,u]),(0,Nn.useEffect)(()=>{e&&l.current&&l.current.focus()},[e]),(0,Nn.useEffect)(()=>{e&&a(0)},[e,n.length]),e?(0,ue.jsx)("div",{className:"fixed inset-x-0 bottom-0 z-[1000] p-2",children:(0,ue.jsxs)("div",{ref:l,className:"relative flex flex-col rounded-large border p-2 outline-none animate-slide-up",style:{backgroundColor:"var(--app-input-secondary-background)",borderColor:"var(--app-input-border)"},tabIndex:0,"data-focused-index":u,children:[(0,ue.jsx)("div",{className:"p-2 absolute inset-0 rounded-large",style:{backgroundColor:"var(--app-input-background)"}}),(0,ue.jsxs)("div",{className:"relative z-[1] text-[1.1em] text-[var(--app-primary-foreground)] flex flex-col min-h-0",children:[(0,ue.jsx)("div",{className:"font-bold text-[var(--app-primary-foreground)] mb-0.5",children:g()}),(t.kind==="edit"||t.kind==="write"||t.kind==="read"||t.kind==="execute"||t.kind==="bash")&&t.title&&(0,ue.jsx)("div",{className:"text-[13px] font-normal text-[var(--app-secondary-foreground)] opacity-90 font-mono whitespace-normal break-words q-line-clamp-3 mb-2",style:{fontSize:".9em",color:"var(--app-secondary-foreground)",marginBottom:"6px"},title:t.title,children:t.title})]}),(0,ue.jsxs)("div",{className:"relative z-[1] flex flex-col gap-1 pb-1",children:[n.map((v,x)=>(0,ue.jsxs)("button",{className:`flex items-center gap-2 px-2 py-1.5 text-left w-full box-border rounded-[4px] border-0 shadow-[inset_0_0_0_1px_var(--app-transparent-inner-border)] transition-colors duration-150 text-[var(--app-primary-foreground)] hover:bg-[var(--app-button-background)] ${u===x?"text-[var(--app-list-active-foreground)] bg-[var(--app-list-active-background)] hover:text-[var(--app-button-foreground)] hover:font-bold hover:relative hover:border-0":"hover:bg-[var(--app-button-background)] hover:text-[var(--app-button-foreground)] hover:font-bold hover:relative hover:border-0"}`,onClick:()=>r(v.optionId),onMouseEnter:()=>a(x),children:[(0,ue.jsx)("span",{className:"inline-flex items-center justify-center min-w-[10px] h-5 font-semibold opacity-60",children:x+1}),(0,ue.jsx)("span",{className:"font-semibold",children:v.name})]},v.optionId)),(()=>{let v=u===n.length,x=n.find(w=>w.kind.includes("reject"))?.optionId;return(0,ue.jsx)(S2,{isFocused:v,customMessage:i,setCustomMessage:s,onFocusRow:()=>a(n.length),onSubmitReject:()=>{x&&r(x)},inputRef:f})})()]})]})}):null},S2=({isFocused:e,customMessage:n,setCustomMessage:t,onFocusRow:r,onSubmitReject:o,inputRef:u})=>(0,ue.jsx)("div",{className:`flex items-center gap-2 px-2 py-1.5 text-left w-full box-border rounded-[4px] border-0 shadow-[inset_0_0_0_1px_var(--app-transparent-inner-border)] cursor-text text-[var(--app-primary-foreground)] ${e?"text-[var(--app-list-active-foreground)]":""}`,onMouseEnter:r,onClick:()=>u.current?.focus(),children:(0,ue.jsx)("input",{ref:u,type:"text",placeholder:"Tell Qwen what to do instead",spellCheck:!1,className:"flex-1 bg-transparent border-0 outline-none text-sm placeholder:opacity-70",style:{color:"var(--app-input-foreground)"},value:n,onChange:a=>t(a.target.value),onFocus:r,onKeyDown:a=>{a.key==="Enter"&&!a.shiftKey&&n.trim()&&(a.preventDefault(),o())}})});var ll=e=>{if(e==null)return"";if(typeof e=="string"){try{e=JSON.parse(e).output??e}catch{}return e}if(e instanceof Error)return e.message||e.toString();if(typeof e=="object"&&e!==null&&"message"in e)return e.message||String(e);if(typeof e=="object")try{return JSON.stringify(e,null,2)}catch{return String(e)}return String(e)},Rn=e=>typeof e=="string"&&e.trim()?e:e&&typeof e=="object"?JSON.stringify(e):"",zf=e=>!e.includes("internal"),Of=e=>{if(e.status==="failed")return!0;let n=e.kind.toLowerCase();if((n==="execute"||n==="bash"||n==="command")&&e.title&&typeof e.title=="string"&&e.title.trim()||e.locations&&e.locations.length>0)return!0;if(e.content&&e.content.length>0){let t=de(e.content);if(t.textOutputs.length>0||t.errors.length>0||t.diffs.length>0||t.otherData.length>0)return!0}return!!(e.title&&typeof e.title=="string"&&e.title.trim())},de=e=>{let n=[],t=[],r=[],o=[];return e?.forEach(u=>{if(u.type==="diff")r.push(u);else if(u.content){let a=u.content;if(a.type==="error"||"error"in a){let i="";typeof a.error=="string"?i=a.error:a.error&&typeof a.error=="object"&&"message"in a.error?i=a.error.message:a.text?i=ll(a.text):a.error?i=ll(a.error):i="An error occurred",t.push(i)}else a.text?n.push(ll(a.text)):o.push(a)}}),{textOutputs:n,errors:t,diffs:r,otherData:o}},Je=e=>{switch(e){case"pending":case"in_progress":return"loading";case"failed":return"error";case"completed":return"success";default:return"default"}};var Tt=A(D(),1);function E2(e){let n=e.split(/[/\\]/);return n[n.length-1]||e}var Ce=({path:e,line:n,column:t,showFullPath:r=!1,className:o="",disableClick:u=!1})=>{let a=Fn(),i=f=>{if(f.preventDefault(),u)return;f.stopPropagation();let m=e;n!=null&&(m+=`:${n}`,t!=null&&(m+=`:${t}`)),console.log("[FileLink] Opening file:",m),a.postMessage({type:"openFile",data:{path:m}})},s=r?e:E2(e),l=n!=null?t!=null?`${e}:${n}:${t}`:`${e}:${n}`:e;return(0,Tt.jsxs)("a",{href:"#",className:["file-link","inline-flex items-center leading-none",u?"pointer-events-none cursor-[inherit] hover:no-underline":"cursor-pointer","text-[11px] no-underline hover:underline","text-[var(--app-primary-foreground)]","transition-colors duration-100 ease-in-out","focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder)] focus:outline-offset-2 focus:rounded-[2px]","active:opacity-80",o].join(" "),onClick:i,title:l,role:"button","aria-label":`Open file: ${l}`,children:[(0,Tt.jsx)("span",{className:"file-link-path",children:s}),n!=null&&(0,Tt.jsxs)("span",{className:"file-link-location opacity-70 text-[0.9em] font-normal dark:opacity-60",children:[":",n,t!=null&&(0,Tt.jsxs)(Tt.Fragment,{children:[":",t]})]})]})};var Bf=document.createElement("style");Bf.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * LayoutComponents.css - Tool call layout styles with timeline support
 */

/* ToolCallContainer with timeline support */
.toolcall-container {
  position: relative;
  padding-left: 30px;
  padding-top: 8px;
  padding-bottom: 8px;
  -webkit-user-select: text;
     -moz-user-select: text;
          user-select: text;
  align-items: flex-start;
}

/* Default timeline connector line */
.toolcall-container::after {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--app-primary-border-color);
}

/* First item: connector starts from status point position */
.toolcall-container:first-child::after {
  top: 24px;
}

/* Last item: connector shows only upper part */
.toolcall-container:last-child::after {
  height: calc(100% - 24px);
  top: 0;
  bottom: auto;
}

/* Status-specific styles using ::before pseudo-element for bullet points */
.toolcall-container.toolcall-status-default::before {
  content: '\\25cf';
  position: absolute;
  left: 8px;
  padding-top: 2px;
  font-size: 10px;
  color: var(--app-secondary-foreground);
  z-index: 1;
}

.toolcall-container.toolcall-status-success::before {
  content: '\\25cf';
  position: absolute;
  left: 8px;
  font-size: 10px;
  color: #74c991;
  z-index: 1;
}

.toolcall-container.toolcall-status-error::before {
  content: '\\25cf';
  position: absolute;
  left: 8px;
  font-size: 10px;
  color: #c74e39;
  z-index: 1;
}

.toolcall-container.toolcall-status-warning::before {
  content: '\\25cf';
  position: absolute;
  left: 8px;
  padding-top: 2px;
  font-size: 10px;
  color: #e1c08d;
  z-index: 1;
}

.toolcall-container.toolcall-status-loading::before {
  content: '\\25cf';
  position: absolute;
  left: 8px;
  padding-top: 2px;
  font-size: 10px;
  color: var(--app-secondary-foreground);
  background-color: var(--app-secondary-background);
  animation: toolcallPulse 1s linear infinite;
  z-index: 1;
}

/* Loading animation */
@keyframes toolcallPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Content wrapper */
.toolcall-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

/* Legacy card styles */
.toolcall-card {
  grid-template-columns: auto 1fr;
  gap: var(--spacing-medium);
  background: var(--app-input-background);
  border: 1px solid var(--app-input-border);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-large);
  margin: var(--spacing-medium) 0;
  align-items: start;
  animation: fadeIn 0.2s ease-in;
}

/* Legacy row styles */
.toolcall-row {
  grid-template-columns: 80px 1fr;
  gap: var(--spacing-medium);
  min-width: 0;
}

.toolcall-row-label {
  font-size: var(--font-size-xs);
  color: var(--app-secondary-foreground);
  font-weight: 500;
  padding-top: 2px;
}

.toolcall-row-content {
  color: var(--app-primary-foreground);
  min-width: 0;
  word-break: break-word;
}

/* Locations list */
.toolcall-locations-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 100%;
}

/* ToolCall header with loading indicator */
.toolcall-header {
  position: relative;
}

.toolcall-header::before {
  content: '\\25cf';
  position: absolute;
  left: -22px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  line-height: 1;
  z-index: 1;
  color: #e1c08d;
  animation: toolcallHeaderPulse 1.5s ease-in-out infinite;
}

/* Loading animation for toolcall header */
@keyframes toolcallHeaderPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* In-progress toolcall specific styles */
.in-progress-toolcall .toolcall-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1;
  min-width: 0;
  max-width: 100%;
}

.in-progress-toolcall .toolcall-header {
  display: flex;
  align-items: center;
  gap: 2;
  position: relative;
  min-width: 0;
}

.in-progress-toolcall .toolcall-content-text {
  word-break: break-word;
  white-space: pre-wrap;
  width: 100%;
}
`;document.head.appendChild(Bf);var Pe=A(D(),1);var Le=({label:e,status:n="success",children:t,toolCallId:r,labelSuffix:o,className:u})=>(0,Pe.jsx)("div",{className:`qwen-message message-item ${u||""} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${n}`,children:(0,Pe.jsxs)("div",{className:"toolcall-content-wrapper flex flex-col gap-2 min-w-0 max-w-full",children:[(0,Pe.jsxs)("div",{className:"flex items-baseline gap-1 relative min-w-0",children:[(0,Pe.jsx)("span",{className:"text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]",children:e}),(0,Pe.jsx)("span",{className:"text-[11px] text-[var(--app-secondary-foreground)]",children:o})]}),t&&(0,Pe.jsx)("div",{className:"text-[var(--app-secondary-foreground)] py-1",children:t})]})}),Oo=({icon:e,children:n})=>(0,Pe.jsx)("div",{className:"grid grid-cols-[auto_1fr] gap-medium bg-[var(--app-input-background)] border border-[var(--app-input-border)] rounded-medium p-large my-medium items-start animate-[fadeIn_0.2s_ease-in] toolcall-card",children:(0,Pe.jsx)("div",{className:"flex flex-col gap-medium min-w-0",children:n})}),Zt=({label:e,children:n})=>(0,Pe.jsxs)("div",{className:"grid grid-cols-[80px_1fr] gap-medium min-w-0",children:[(0,Pe.jsx)("div",{className:"text-xs text-[var(--app-secondary-foreground)] font-medium pt-[2px]",children:e}),(0,Pe.jsx)("div",{className:"text-[var(--app-primary-foreground)] min-w-0 break-words",children:n})]});var Uf=({locations:e})=>(0,Pe.jsx)("div",{className:"toolcall-locations-list flex flex-col gap-1 max-w-full",children:e.map((n,t)=>(0,Pe.jsx)(Ce,{path:n.path,line:n.line,showFullPath:!0},t))});var Fe=A(D(),1);var jf=({toolCall:e})=>{let{kind:n,title:t,content:r,locations:o,toolCallId:u}=e,a=Rn(t),{textOutputs:i,errors:s}=de(r);if(s.length>0)return(0,Fe.jsxs)(Oo,{icon:"\u{1F527}",children:[(0,Fe.jsx)(Zt,{label:n,children:(0,Fe.jsx)("div",{children:a})}),(0,Fe.jsx)(Zt,{label:"Error",children:(0,Fe.jsx)("div",{className:"text-[#c74e39] font-medium",children:s.join(`
`)})})]});if(i.length>0){let l=i.join(`
`);if(l.length>150){let g=l.length>300?l.substring(0,300)+"...":l;return(0,Fe.jsxs)(Oo,{icon:"\u{1F527}",children:[(0,Fe.jsx)(Zt,{label:n,children:(0,Fe.jsx)("div",{children:a})}),(0,Fe.jsx)(Zt,{label:"Output",children:(0,Fe.jsx)("div",{className:"whitespace-pre-wrap font-mono text-[13px] opacity-90",children:g})})]})}let m=e.status==="in_progress"||e.status==="pending"?"loading":"success";return(0,Fe.jsx)(Le,{label:n,status:m,toolCallId:u,children:a||l})}if(o&&o.length>0){let l=e.status==="in_progress"||e.status==="pending"?"loading":"success";return(0,Fe.jsx)(Le,{label:n,status:l,toolCallId:u,children:(0,Fe.jsx)(Uf,{locations:o})})}if(a){let l=e.status==="in_progress"||e.status==="pending"?"loading":"success";return(0,Fe.jsx)(Le,{label:n,status:l,toolCallId:u,children:a})}return null};var Lr=A(xe(),1);var qf=(e,n,t,r)=>{n&&e.postMessage({type:"openDiff",data:{path:n,oldText:t||"",newText:r||""}})};var $e=A(D(),1);var cl=({label:e,status:n="success",children:t,toolCallId:r,labelSuffix:o,className:u})=>(0,$e.jsx)("div",{className:`ReadToolCall qwen-message message-item ${u||""} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${n}`,children:(0,$e.jsxs)("div",{className:"toolcall-content-wrapper flex flex-col gap-1 min-w-0 max-w-full",children:[(0,$e.jsxs)("div",{className:"flex items-baseline gap-1.5 relative min-w-0",children:[(0,$e.jsx)("span",{className:"text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]",children:e}),(0,$e.jsx)("span",{className:"text-[11px] text-[var(--app-secondary-foreground)]",children:o})]}),t&&(0,$e.jsx)("div",{className:"text-[var(--app-secondary-foreground)] py-1",children:t})]})}),Hf=({toolCall:e})=>{let{content:n,locations:t,toolCallId:r}=e,o=Fn(),{errors:u,diffs:a}=(0,Lr.useMemo)(()=>de(n),[n]),i=(0,Lr.useCallback)((l,f,m)=>{qf(o,l,f,m)},[o]);(0,Lr.useEffect)(()=>{if(a.length>0){let l=a[0],f=l.path||t&&t[0]?.path||"";if(f&&l.oldText!==void 0&&l.newText!==void 0){let m=setTimeout(()=>{i(f,l.oldText,l.newText)},100);return()=>m&&clearTimeout(m)}}},[r]);let s=Je(e.status);if(u.length>0){let l=t?.[0]?.path||"";return(0,$e.jsx)(cl,{label:"Read",className:"read-tool-call-error",status:"error",toolCallId:r,labelSuffix:l?(0,$e.jsx)(Ce,{path:l,showFullPath:!1,className:"text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline"}):void 0,children:u.join(`
`)})}if(a.length>0){let l=a[0]?.path||t?.[0]?.path||"";return(0,$e.jsx)(cl,{label:"Read",className:"read-tool-call-success",status:s,toolCallId:r,labelSuffix:l?(0,$e.jsx)(Ce,{path:l,showFullPath:!1,className:"text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline"}):void 0,children:null})}if(t&&t.length>0){let l=t[0].path;return(0,$e.jsx)(cl,{label:"Read",className:"read-tool-call-success",status:s,toolCallId:r,labelSuffix:l?(0,$e.jsx)(Ce,{path:l,showFullPath:!1,className:"text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline"}):void 0,children:null})}return null};var ze=A(D(),1);var Vf=({toolCall:e})=>{let{content:n,locations:t,rawInput:r,toolCallId:o}=e,{errors:u,textOutputs:a}=de(n),i="";if(r&&typeof r=="object"?i=r.content||"":typeof r=="string"&&(i=r),u.length>0){let s=t?.[0]?.path||"",l=u.join(`
`),f=i.length>200?i.substring(0,200)+"...":i;return(0,ze.jsxs)(Le,{label:"Write",status:"error",toolCallId:o,labelSuffix:s?(0,ze.jsx)(Ce,{path:s,showFullPath:!1,className:"text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline"}):void 0,children:[(0,ze.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,ze.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,ze.jsx)("span",{className:"flex-shrink-0 w-full",children:l})]}),f&&(0,ze.jsx)("div",{className:"bg-[var(--app-input-background)] border border-[var(--app-input-border)] rounded-md p-3 mt-1",children:(0,ze.jsx)("pre",{className:"font-mono text-[13px] whitespace-pre-wrap break-words text-[var(--app-primary-foreground)] opacity-90",children:f})})]})}if(t&&t.length>0){let s=t[0].path,l=i.split(`
`).length,f=Je(e.status);return(0,ze.jsx)(Le,{label:"Created",status:f,toolCallId:o,labelSuffix:s?(0,ze.jsx)(Ce,{path:s,showFullPath:!1,className:"text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline"}):void 0,children:(0,ze.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-center",children:[(0,ze.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,ze.jsxs)("span",{className:"flex-shrink-0 w-full",children:[l," lines"]})]})})}if(a.length>0){let s=Je(e.status);return(0,ze.jsx)(Le,{label:"Write",status:s,toolCallId:o,children:a.join(`
`)})}return null};var Wf=A(xe(),1);var $=A(D(),1);var $f=({label:e,status:n="success",children:t,toolCallId:r,labelSuffix:o,className:u})=>(0,$.jsx)("div",{className:`qwen-message message-item ${u||""} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${n}`,children:(0,$.jsxs)("div",{className:"EditToolCall toolcall-content-wrapper flex flex-col gap-1 min-w-0 max-w-full",children:[(0,$.jsxs)("div",{className:"flex items-baseline gap-1.5 relative min-w-0",children:[(0,$.jsx)("span",{className:"text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]",children:e}),(0,$.jsx)("span",{className:"text-[11px] text-[var(--app-secondary-foreground)]",children:o})]}),t&&(0,$.jsx)("div",{className:"text-[var(--app-secondary-foreground)]",children:t})]})}),T2=(e,n)=>{let t=e?e.split(`
`).length:0,o=(n?n.split(`
`).length:0)-t;return o>0?`+${o} lines`:o<0?`${o} lines`:"Modified"},Qf=({toolCall:e})=>{let{content:n,locations:t,toolCallId:r}=e,{errors:o,diffs:u}=(0,Wf.useMemo)(()=>de(n),[n]);if(e.status==="failed"){let i=u[0]?.path||t?.[0]?.path||"",s=Je(e.status);return(0,$.jsx)("div",{className:`qwen-message message-item relative py-2 select-text toolcall-container toolcall-status-${s}`,children:(0,$.jsxs)("div",{className:"toolcall-edit-content flex flex-col gap-1 min-w-0 max-w-full",children:[(0,$.jsx)("div",{className:"flex items-center justify-between min-w-0",children:(0,$.jsxs)("div",{className:"flex items-baseline gap-2 min-w-0",children:[(0,$.jsx)("span",{className:"text-[13px] leading-none font-bold text-[var(--app-primary-foreground)]",children:"Edit"}),i&&(0,$.jsx)(Ce,{path:i,showFullPath:!1,className:"font-mono text-[var(--app-secondary-foreground)] hover:underline"})]})}),(0,$.jsx)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-center",children:(0,$.jsx)("span",{className:"flex-shrink-0 w-full",children:"edit failed"})})]})})}if(o.length>0){let a=u[0]?.path||t?.[0]?.path||"";return(0,$.jsx)($f,{label:"Edit",status:"error",toolCallId:r,labelSuffix:a?(0,$.jsx)(Ce,{path:a,showFullPath:!1,className:"text-xs font-mono hover:underline"}):void 0,children:o.join(`
`)})}if(u.length>0){let a=u[0],i=a.path||t&&t[0]?.path||"",s=T2(a.oldText,a.newText),l=Je(e.status);return(0,$.jsx)("div",{className:`qwen-message message-item relative py-2 select-text toolcall-container toolcall-status-${l}`,children:(0,$.jsxs)("div",{className:"toolcall-edit-content flex flex-col gap-1 min-w-0 max-w-full",children:[(0,$.jsx)("div",{className:"flex items-center justify-between min-w-0",children:(0,$.jsxs)("div",{className:"flex items-baseline gap-1.5 min-w-0",children:[(0,$.jsx)("span",{className:"text-[13px] leading-none font-bold text-[var(--app-primary-foreground)]",children:"Edit"}),i&&(0,$.jsx)(Ce,{path:i,showFullPath:!1,className:"font-mono text-[var(--app-secondary-foreground)] hover:underline"})]})}),(0,$.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-baseline",children:[(0,$.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,$.jsx)("span",{className:"flex-shrink-0 w-full",children:s})]})]})})}if(t&&t.length>0){let a=Je(e.status);return(0,$.jsx)($f,{label:"Edit",status:a,toolCallId:r,labelSuffix:(0,$.jsx)(Ce,{path:t[0].path,showFullPath:!1,className:"text-xs font-mono text-[var(--app-secondary-foreground)] hover:underline"}),children:(0,$.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 flex-row items-start w-full gap-1 flex items-center",children:[(0,$.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,$.jsx)(Ce,{path:t[0].path,line:t[0].line,showFullPath:!0})]})})}return null};async function dl(e,n,t="temp",r=".txt"){e({type:"createAndOpenTempFile",data:{content:n,fileName:t,fileExtension:r}})}var Zf=document.createElement("style");Zf.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Execute tool call styles - Enhanced styling with semantic class names
 */

/* Root container for execute tool call output */
.bash-toolcall-card {
  border: 0.5px solid var(--app-input-border);
  border-radius: 5px;
  background: var(--app-tool-background);
  margin: 8px 0;
  max-width: 100%;
  font-size: 1em;
  align-items: start;
}

/* Content wrapper inside the card */
.bash-toolcall-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px;
}

/* Individual input/output row */
.bash-toolcall-row {
  display: grid;
  grid-template-columns: max-content 1fr;
  border-top: 0.5px solid var(--app-input-border);
  padding: 4px;
}

/* First row has no top border */
.bash-toolcall-row:first-child {
  border-top: none;
}

/* Row label (IN/OUT/ERROR) */
.bash-toolcall-label {
  grid-column: 1;
  color: var(--app-secondary-foreground);
  text-align: left;
  opacity: 50%;
  padding: 4px 8px 4px 4px;
  font-family: var(--app-monospace-font-family);
  font-size: 0.85em;
}

/* Row content area */
.bash-toolcall-row-content {
  grid-column: 2;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 4px;
}

/* Truncated content styling */
.bash-toolcall-row-content:not(.bash-toolcall-full) {
  max-height: 60px;
  -webkit-mask-image: linear-gradient(
    to bottom,
    var(--app-primary-background) 40px,
    transparent 60px
  );
          mask-image: linear-gradient(
    to bottom,
    var(--app-primary-background) 40px,
    transparent 60px
  );
  overflow: hidden;
}

/* Preformatted content */
.bash-toolcall-pre {
  margin-block: 0;
  overflow: hidden;
  font-family: var(--app-monospace-font-family);
  font-size: 0.85em;
}

/* Code content */
.bash-toolcall-code {
  margin: 0;
  padding: 0;
  font-family: var(--app-monospace-font-family);
  font-size: 0.85em;
}

/* Output content with subtle styling */
.bash-toolcall-output-subtle {
  background-color: var(--app-code-background);
  white-space: pre;
  overflow-x: auto;
  max-width: 100%;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

/* Error content styling */
.bash-toolcall-error-content {
  color: #c74e39;
}
`;document.head.appendChild(Zf);var j=A(D(),1);var Gf=({toolCall:e})=>{let{title:n,content:t,rawInput:r,toolCallId:o}=e,u=Rn(n),a=Fn(),{textOutputs:i,errors:s}=de(t),l=u;r&&typeof r=="object"?l=r.command||u:typeof r=="string"&&(l=r);let f=()=>{dl(a.postMessage,l,"bash-input",".sh")},m=()=>{if(i.length>0){let v=i.join(`
`);dl(a.postMessage,v,"bash-output",".txt")}},g=s.length>0?"error":e.status==="in_progress"||e.status==="pending"?"loading":"success";if(s.length>0)return(0,j.jsxs)(Le,{label:"Bash",status:g,toolCallId:o,children:[(0,j.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,j.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,j.jsx)("span",{className:"flex-shrink-0 w-full",children:u})]}),(0,j.jsx)("div",{className:"bash-toolcall-card",children:(0,j.jsxs)("div",{className:"bash-toolcall-content",children:[(0,j.jsxs)("div",{className:"bash-toolcall-row",onClick:f,style:{cursor:"pointer"},children:[(0,j.jsx)("div",{className:"bash-toolcall-label",children:"IN"}),(0,j.jsx)("div",{className:"bash-toolcall-row-content",children:(0,j.jsx)("pre",{className:"bash-toolcall-pre",children:l})})]}),(0,j.jsxs)("div",{className:"bash-toolcall-row",children:[(0,j.jsx)("div",{className:"bash-toolcall-label",children:"Error"}),(0,j.jsx)("div",{className:"bash-toolcall-row-content",children:(0,j.jsx)("pre",{className:"bash-toolcall-pre bash-toolcall-error-content",children:s.join(`
`)})})]})]})})]});if(i.length>0){let v=i.join(`
`),x=v.length>500?v.substring(0,500)+"...":v;return(0,j.jsxs)(Le,{label:"Bash",status:g,toolCallId:o,children:[(0,j.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,j.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,j.jsx)("span",{className:"flex-shrink-0 w-full",children:u})]}),(0,j.jsx)("div",{className:"bash-toolcall-card",children:(0,j.jsxs)("div",{className:"bash-toolcall-content",children:[(0,j.jsxs)("div",{className:"bash-toolcall-row",onClick:f,style:{cursor:"pointer"},children:[(0,j.jsx)("div",{className:"bash-toolcall-label",children:"IN"}),(0,j.jsx)("div",{className:"bash-toolcall-row-content",children:(0,j.jsx)("pre",{className:"bash-toolcall-pre",children:l})})]}),(0,j.jsxs)("div",{className:"bash-toolcall-row",onClick:m,style:{cursor:"pointer"},children:[(0,j.jsx)("div",{className:"bash-toolcall-label",children:"OUT"}),(0,j.jsx)("div",{className:"bash-toolcall-row-content",children:(0,j.jsx)("div",{className:"bash-toolcall-output-subtle",children:(0,j.jsx)("pre",{className:"bash-toolcall-pre",children:x})})})]})]})})]})}return(0,j.jsx)(Le,{label:"Bash",status:g,toolCallId:o,children:(0,j.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",onClick:f,style:{cursor:"pointer"},children:[(0,j.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,j.jsx)("span",{className:"flex-shrink-0 w-full",children:u})]})})};var Xf=document.createElement("style");Xf.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Execute tool call styles - Enhanced styling with semantic class names
 */

/* Root container for execute tool call output */
.execute-toolcall-card {
  border: 0.5px solid var(--app-input-border);
  border-radius: 5px;
  background: var(--app-tool-background);
  margin: 8px 0;
  max-width: 100%;
  font-size: 1em;
  align-items: start;
}

/* Content wrapper inside the card */
.execute-toolcall-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px;
}

/* Individual input/output row */
.execute-toolcall-row {
  display: grid;
  grid-template-columns: max-content 1fr;
  border-top: 0.5px solid var(--app-input-border);
  padding: 4px;
}

/* First row has no top border */
.execute-toolcall-row:first-child {
  border-top: none;
}

/* Row label (IN/OUT/ERROR) */
.execute-toolcall-label {
  grid-column: 1;
  color: var(--app-secondary-foreground);
  text-align: left;
  opacity: 50%;
  padding: 4px 8px 4px 4px;
  font-family: var(--app-monospace-font-family);
  font-size: 0.85em;
}

/* Row content area */
.execute-toolcall-row-content {
  grid-column: 2;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 4px;
}

/* Truncated content styling */
.execute-toolcall-row-content:not(.execute-toolcall-full) {
  max-height: 60px;
  -webkit-mask-image: linear-gradient(
    to bottom,
    var(--app-primary-background) 40px,
    transparent 60px
  );
          mask-image: linear-gradient(
    to bottom,
    var(--app-primary-background) 40px,
    transparent 60px
  );
  overflow: hidden;
}

/* Preformatted content */
.execute-toolcall-pre {
  margin-block: 0;
  overflow: hidden;
  font-family: var(--app-monospace-font-family);
  font-size: 0.85em;
}

/* Code content */
.execute-toolcall-code {
  margin: 0;
  padding: 0;
  font-family: var(--app-monospace-font-family);
  font-size: 0.85em;
}

/* Output content with subtle styling */
.execute-toolcall-output-subtle {
  background-color: var(--app-code-background);
  white-space: pre;
  overflow-x: auto;
  max-width: 100%;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

/* Error content styling */
.execute-toolcall-error-content {
  color: #c74e39;
}
`;document.head.appendChild(Xf);var L=A(D(),1);var pl=({label:e,status:n="success",children:t,toolCallId:r,labelSuffix:o,className:u})=>(0,L.jsx)("div",{className:`ExecuteToolCall qwen-message message-item ${u||""} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${n}`,children:(0,L.jsxs)("div",{className:"toolcall-content-wrapper flex flex-col gap-0 min-w-0 max-w-full",children:[(0,L.jsxs)("div",{className:"flex items-baseline gap-1.5 relative min-w-0",children:[(0,L.jsx)("span",{className:"text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]",children:e}),(0,L.jsx)("span",{className:"text-[11px] text-[var(--app-secondary-foreground)]",children:o})]}),t&&(0,L.jsx)("div",{className:"text-[var(--app-secondary-foreground)]",children:t})]})}),Yf=({toolCall:e})=>{let{title:n,content:t,rawInput:r,toolCallId:o}=e,u=Rn(r?.description||n),{textOutputs:a,errors:i}=de(t),s=u;r&&typeof r=="object"?s=r.command||u:typeof r=="string"&&(s=r);let l=i.length>0||e.status==="failed"?"error":e.status==="in_progress"||e.status==="pending"?"loading":"success";if(i.length>0)return(0,L.jsxs)(pl,{label:"Execute",status:l,toolCallId:o,className:"execute-default-toolcall",children:[(0,L.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,L.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,L.jsx)("span",{className:"flex-shrink-0 w-full",children:u})]}),(0,L.jsx)("div",{className:"execute-toolcall-card",children:(0,L.jsxs)("div",{className:"execute-toolcall-content",children:[(0,L.jsxs)("div",{className:"execute-toolcall-row",children:[(0,L.jsx)("div",{className:"execute-toolcall-label",children:"IN"}),(0,L.jsx)("div",{className:"execute-toolcall-row-content",children:(0,L.jsx)("pre",{className:"execute-toolcall-pre",children:s})})]}),(0,L.jsxs)("div",{className:"execute-toolcall-row",children:[(0,L.jsx)("div",{className:"execute-toolcall-label",children:"Error"}),(0,L.jsx)("div",{className:"execute-toolcall-row-content",children:(0,L.jsx)("pre",{className:"execute-toolcall-pre execute-toolcall-error-content",children:i.join(`
`)})})]})]})})]});if(a.length>0){let f=a.join(`
`),m=f.length>500?f.substring(0,500)+"...":f;return(0,L.jsxs)(pl,{label:"Execute",status:l,toolCallId:o,children:[(0,L.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,L.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,L.jsx)("span",{className:"flex-shrink-0 w-full",children:u})]}),(0,L.jsx)("div",{className:"execute-toolcall-card",children:(0,L.jsxs)("div",{className:"execute-toolcall-content",children:[(0,L.jsxs)("div",{className:"execute-toolcall-row",children:[(0,L.jsx)("div",{className:"execute-toolcall-label",children:"IN"}),(0,L.jsx)("div",{className:"execute-toolcall-row-content",children:(0,L.jsx)("pre",{className:"execute-toolcall-pre",children:s})})]}),(0,L.jsxs)("div",{className:"execute-toolcall-row",children:[(0,L.jsx)("div",{className:"execute-toolcall-label",children:"OUT"}),(0,L.jsx)("div",{className:"execute-toolcall-row-content",children:(0,L.jsx)("div",{className:"execute-toolcall-output-subtle",children:(0,L.jsx)("pre",{className:"execute-toolcall-pre",children:m})})})]})]})})]})}return(0,L.jsx)(pl,{label:"Execute",status:l,toolCallId:o,children:(0,L.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,L.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,L.jsx)("span",{className:"flex-shrink-0 w-full",children:u})]})})};var Bo=A(D(),1);var Kf=({checked:e=!1,indeterminate:n=!1,disabled:t=!0,className:r="",style:o,title:u})=>{let a=!!e&&!n,i=!!n;return(0,Bo.jsxs)("span",{role:"checkbox","aria-checked":n?"mixed":!!e,"aria-disabled":t||void 0,title:u,style:o,className:["q m-[2px] shrink-0 w-4 h-4 relative rounded-[2px] box-border","border border-[var(--app-input-border)] bg-[var(--app-input-background)]","inline-flex items-center justify-center",a?"opacity-70":"",r].join(" "),children:[a?(0,Bo.jsx)("span",{"aria-hidden":!0,className:["absolute block","left-[3px] top-[3px]","w-2.5 h-1.5","border-l-2 border-b-2","border-[#74c991]","-rotate-45"].join(" ")}):null,i?(0,Bo.jsx)("span",{"aria-hidden":!0,className:["absolute inline-block","left-1/2 top-[10px] -translate-x-1/2 -translate-y-1/2","text-[16px] leading-none text-[#e1c08d] select-none"].join(" "),children:"*"}):null]})};var Oe=A(D(),1);var Jf=({label:e,status:n="success",children:t,toolCallId:r,labelSuffix:o,className:u})=>(0,Oe.jsx)("div",{className:`qwen-message message-item ${u||""} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${n}`,children:(0,Oe.jsxs)("div",{className:"UpdatedPlanToolCall toolcall-content-wrapper flex flex-col gap-2 min-w-0 max-w-full",children:[(0,Oe.jsxs)("div",{className:"flex items-baseline gap-1 relative min-w-0",children:[(0,Oe.jsx)("span",{className:"text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]",children:e}),(0,Oe.jsx)("span",{className:"text-[11px] text-[var(--app-secondary-foreground)]",children:o})]}),t&&(0,Oe.jsx)("div",{className:"text-[var(--app-secondary-foreground)] py-1",children:t})]})}),A2=e=>{switch(e){case"completed":return"success";case"failed":return"error";case"in_progress":return"warning";case"pending":return"loading";default:return"default"}},D2=e=>{let t=e.join(`
`).split(/\r?\n/),r=[],o=/^(?:\s*(?:[-*]|\d+[.)])\s*)?\[( |x|X|-|\*)\]\s+(.*)$/;for(let u of t){let a=u.match(o);if(a){let i=a[1],s=a[2].trim(),l=i==="x"||i==="X"?"completed":i==="-"||i==="*"?"in_progress":"pending";s&&r.push({content:s,status:l})}}if(r.length===0)for(let u of t){let a=u.trim();a&&r.push({content:a,status:"pending"})}return r},em=({toolCall:e})=>{let{content:n,status:t}=e,{errors:r,textOutputs:o}=de(n);if(r.length>0)return(0,Oe.jsx)(Jf,{label:"Updated Plan",status:"error",children:r.join(`
`)});let u=D2(o),a=Rn(e.title)||"Updated Plan";return(0,Oe.jsx)(Jf,{label:a,status:A2(t),className:"update-plan-toolcall",children:(0,Oe.jsx)("ul",{className:"Fr list-none p-0 m-0 flex flex-col gap-1",children:u.map((i,s)=>{let l=i.status==="completed",f=i.status==="in_progress";return(0,Oe.jsxs)("li",{className:["Hr flex items-start gap-2 p-0 rounded text-[var(--app-primary-foreground)]",l?"fo opacity-70":""].join(" "),children:[(0,Oe.jsx)("label",{className:"flex items-start gap-2",children:(0,Oe.jsx)(Kf,{checked:l,indeterminate:f})}),(0,Oe.jsx)("div",{className:["vo flex-1 text-xs leading-[1.5] text-[var(--app-primary-foreground)]",l?"line-through text-[var(--app-secondary-foreground)] opacity-70":"opacity-85"].join(" "),children:i.content})]},s)})})})};var z=A(D(),1);var fl=({status:e,labelSuffix:n,children:t,isFirst:r,isLast:o})=>{let u=`toolcall-container toolcall-status-${e}`,a=r?"top-[24px]":"top-0",i=o?"bottom-auto h-[calc(100%-24px)]":"bottom-0";return(0,z.jsxs)("div",{className:'qwen-message message-item relative pl-[30px] py-2 select-text before:absolute before:left-[8px] before:top-2 before:content-["\\25cf"] before:text-[10px] before:z-[1] '+u,children:[(0,z.jsx)("div",{className:`absolute left-[12px] ${a} ${i} w-px bg-[var(--app-primary-border-color)]`,"aria-hidden":!0}),(0,z.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,z.jsxs)("div",{className:"flex items-baseline gap-2 min-w-0",children:[(0,z.jsx)("span",{className:"text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]",children:"Search"}),n?(0,z.jsx)("span",{className:"text-[11px] text-[var(--app-secondary-foreground)]",children:n}):null]}),t?(0,z.jsx)("div",{className:"mt-1 text-[var(--app-secondary-foreground)]",children:t}):null]})]})},nm=({status:e,children:n,isFirst:t,isLast:r})=>{let o=e==="success"?"before:text-qwen-success":e==="error"?"before:text-qwen-error":e==="warning"?"before:text-qwen-warning":"before:text-qwen-loading before:opacity-70 before:animate-pulse-slow",u=t?"top-[24px]":"top-0",a=r?"bottom-auto h-[calc(100%-24px)]":"bottom-0";return(0,z.jsxs)("div",{className:'qwen-message message-item relative pl-[30px] py-2 select-text before:absolute before:left-[8px] before:top-2 before:content-["\\25cf"] before:text-[10px] before:z-[1] '+o,children:[(0,z.jsx)("div",{className:`absolute left-[12px] ${u} ${a} w-px bg-[var(--app-primary-border-color)]`,"aria-hidden":!0}),(0,z.jsx)("div",{className:"bg-[var(--app-input-background)] border border-[var(--app-input-border)] rounded-medium p-large my-medium",children:(0,z.jsx)("div",{className:"flex flex-col gap-3 min-w-0",children:n})})]})},va=({label:e,children:n})=>(0,z.jsxs)("div",{className:"grid grid-cols-[80px_1fr] gap-medium min-w-0",children:[(0,z.jsx)("div",{className:"text-xs text-[var(--app-secondary-foreground)] font-medium pt-[2px]",children:e}),(0,z.jsx)("div",{className:"text-[var(--app-primary-foreground)] min-w-0 break-words",children:n})]}),tm=({locations:e})=>(0,z.jsx)("div",{className:"flex flex-col gap-1 max-w-full",children:e.map((n,t)=>(0,z.jsx)(Ce,{path:n.path,line:n.line,showFullPath:!0},t))}),rm=({toolCall:e,isFirst:n,isLast:t})=>{let{title:r,content:o,locations:u}=e,a=Rn(r),{errors:i,textOutputs:s}=de(o);if(i.length>0)return(0,z.jsxs)(nm,{status:"error",isFirst:n,isLast:t,children:[(0,z.jsx)(va,{label:"Search",children:(0,z.jsx)("div",{className:"font-mono",children:a})}),(0,z.jsx)(va,{label:"Error",children:(0,z.jsx)("div",{className:"text-qwen-error font-medium",children:i.join(`
`)})})]});if(u&&u.length>0){let l=Je(e.status);return u.length>1?(0,z.jsxs)(nm,{status:l,isFirst:n,isLast:t,children:[(0,z.jsx)(va,{label:"Search",children:(0,z.jsx)("div",{className:"font-mono",children:a})}),(0,z.jsx)(va,{label:`Found (${u.length})`,children:(0,z.jsx)(tm,{locations:u})})]}):(0,z.jsxs)(fl,{status:l,labelSuffix:`(${a})`,isFirst:n,isLast:t,children:[(0,z.jsx)("span",{className:"mx-2 opacity-50",children:"\u2192"}),(0,z.jsx)(tm,{locations:u})]})}if(s.length>0){let l=Je(e.status);return(0,z.jsx)(fl,{status:l,labelSuffix:a?`(${a})`:void 0,isFirst:n,isLast:t,children:(0,z.jsx)("div",{className:"flex flex-col",children:s.map((f,m)=>(0,z.jsxs)("div",{className:"inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1",children:[(0,z.jsx)("span",{className:"flex-shrink-0 relative top-[-0.1em]",children:"\u23BF"}),(0,z.jsx)("span",{className:"flex-shrink-0 w-full",children:f})]},m))})})}if(a){let l=Je(e.status);return(0,z.jsx)(fl,{status:l,isFirst:n,isLast:t,children:(0,z.jsx)("span",{className:"font-mono",children:a})})}return null};var Gt=A(D(),1);var om=({toolCall:e})=>{let{content:n}=e,{textOutputs:t,errors:r}=de(n);if(r.length>0)return(0,Gt.jsx)(Le,{label:"Thinking",status:"error",children:r.join(`
`)});if(t.length>0){let o=t.join(`

`);if(o.length>200){let i=o.length>500?o.substring(0,500)+"...":o;return(0,Gt.jsx)(Oo,{icon:"\u{1F4AD}",children:(0,Gt.jsx)(Zt,{label:"Thinking",children:(0,Gt.jsx)("div",{className:"italic opacity-90 leading-relaxed",children:i})})})}let a=e.status==="pending"||e.status==="in_progress"?"loading":"default";return(0,Gt.jsx)(Le,{label:"Thinking",status:a,children:(0,Gt.jsx)("span",{className:"italic opacity-90",children:o})})}return null};var am=A(D(),1);var F2=e=>{switch(e.toLowerCase()){case"read":return Hf;case"write":return Vf;case"edit":return Qf;case"execute":return Yf;case"bash":case"command":return Gf;case"updated_plan":case"updatedplan":case"todo_write":case"update_todos":case"todowrite":return em;case"search":case"grep":case"glob":case"find":return rm;case"think":case"thinking":return om;default:return jf}},um=({toolCall:e,isFirst:n,isLast:t})=>{if(!zf(e.kind))return null;let r=F2(e.kind);return(0,am.jsx)(r,{toolCall:e,isFirst:n,isLast:t})};var sm=A(D(),1);var im=({toolCall:e,isFirst:n,isLast:t})=>(0,sm.jsx)(um,{toolCall:e,isFirst:n,isLast:t});function N2(){if(window.__EXTENSION_URI__)return window.__EXTENSION_URI__;let e=document.body?.getAttribute("data-extension-uri");if(e)return window.__EXTENSION_URI__=e,e}function lm(e){try{return["vscode-webview-resource:","https-vscode-webview-resource:","vscode-file:","https:"].some(t=>e.startsWith(t))}catch{return!1}}function R2(e){let n=N2();if(!n)return console.warn("[resourceUrl] Extension URI not found in window or body"),"";if(!lm(n))return console.error("[resourceUrl] Invalid extension URI - possible security risk:",n),"";let t=e.startsWith("/")?e.slice(1):e,o=`${n.endsWith("/")?n:`${n}/`}${t}`;return lm(o)?o:(console.error("[resourceUrl] Generated URL failed validation:",o),"")}function ba(e){return R2(`assets/${e}`)}var et=A(D(),1);var ml=({isAuthenticated:e=!1,loadingMessage:n})=>{let t=ba("icon.png");return(0,et.jsx)("div",{className:"flex flex-col items-center justify-center h-full p-5 md:p-10",children:(0,et.jsx)("div",{className:"flex flex-col items-center gap-8 w-full",children:(0,et.jsxs)("div",{className:"flex flex-col items-center gap-6",children:[t?(0,et.jsx)("img",{src:t,alt:"Qwen Logo",className:"w-[60px] h-[60px] object-contain",onError:o=>{let u=o.target;u.style.display="none";let a=u.parentElement;if(a){let i=document.createElement("div");i.className="w-[60px] h-[60px] flex items-center justify-center text-2xl font-bold",i.textContent="Q",a.appendChild(i)}}}):(0,et.jsx)("div",{className:"w-[60px] h-[60px] flex items-center justify-center text-2xl font-bold bg-gray-200 rounded",children:"Q"}),(0,et.jsx)("div",{className:"text-center",children:(0,et.jsx)("div",{className:"text-[15px] text-app-primary-foreground leading-normal font-normal max-w-[400px]",children:n?"Preparing Qwen Code\u2026":e?"What would you like to do? Ask about this codebase or we can start writing code.":"Welcome! Please log in to start using Qwen Code."})})]})})})};var wn=A(D(),1);var cm=({onLogin:e})=>{let n=ba("icon.png");return(0,wn.jsx)("div",{className:"flex flex-col items-center justify-center h-full p-5 md:p-10",children:(0,wn.jsx)("div",{className:"flex flex-col items-center gap-8 w-full max-w-md mx-auto",children:(0,wn.jsxs)("div",{className:"flex flex-col items-center gap-6",children:[(0,wn.jsx)("div",{className:"relative",children:(0,wn.jsx)("img",{src:n,alt:"Qwen Code Logo",className:"w-[80px] h-[80px] object-contain"})}),(0,wn.jsxs)("div",{className:"text-center",children:[(0,wn.jsx)("h1",{className:"text-2xl font-bold text-app-primary-foreground mb-2",children:"Welcome to Qwen Code"}),(0,wn.jsx)("p",{className:"text-app-secondary-foreground max-w-sm",children:"Unlock the power of AI to understand, navigate, and transform your codebase faster than ever before."})]}),(0,wn.jsx)("button",{onClick:e,className:"w-full px-4 py-3 bg-[#4f46e5] text-white font-medium rounded-lg shadow-sm hover:bg-[#4338ca] transition-colors duration-200",children:"Get Started with Qwen Code"})]})})})};var en=A(xe(),1);function dm(e,n){let t=(0,en.useMemo)(()=>({id:"loading",label:"Loading\u2026",type:"info"}),[]),r=(0,en.useMemo)(()=>({id:"timeout",label:"Timeout",type:"info"}),[]),o=5e3,[u,a]=(0,en.useState)({isOpen:!1,triggerChar:null,query:"",position:{top:0,left:0},items:[]}),i=(0,en.useRef)(null),s=(0,en.useCallback)(()=>{i.current&&(clearTimeout(i.current),i.current=null),a({isOpen:!1,triggerChar:null,query:"",position:{top:0,left:0},items:[]})},[]),l=(0,en.useCallback)(async(g,v,x)=>{i.current&&(clearTimeout(i.current),i.current=null),a({isOpen:!0,triggerChar:g,query:v,position:x,items:[t]}),i.current=setTimeout(()=>{a(C=>C.isOpen&&C.triggerChar===g&&C.query===v&&C.items.length>0&&C.items[0]?.id==="loading"?{...C,items:[r]}:C)},o);let w=await n(g,v);i.current&&(clearTimeout(i.current),i.current=null),a(C=>({...C,isOpen:!0,triggerChar:g,query:v,position:x,items:w}))},[n,t,r]),f=(g,v)=>{if(g.length!==v.length)return!1;for(let x=0;x<g.length;x++){let w=g[x],C=v[x];if(w.id!==C.id||w.label!==C.label||(w.description??"")!==(C.description??"")||w.type!==C.type||(w.value??"")!==(C.value??"")||(w.path??"")!==(C.path??""))return!1}return!0},m=(0,en.useCallback)(async()=>{if(!u.isOpen||!u.triggerChar)return;let g=await n(u.triggerChar,u.query);a(v=>f(v.items,g)?v:{...v,items:g})},[u.isOpen,u.triggerChar,u.query,n]);return(0,en.useEffect)(()=>{let g=e.current;if(!g)return;let v=()=>{let w=window.getSelection();if(!w||w.rangeCount===0)return null;try{let h=w.getRangeAt(0).getBoundingClientRect();if(h.top>0&&h.left>0)return{top:h.top,left:h.left};let d=g.getBoundingClientRect();return{top:d.top,left:d.left}}catch(C){console.error("[useCompletionTrigger] Error getting cursor position:",C);let h=g.getBoundingClientRect();return{top:h.top,left:h.left}}},x=async()=>{let w=g.textContent||"",C=window.getSelection();if(!C||C.rangeCount===0){console.log("[useCompletionTrigger] No selection or rangeCount === 0");return}let h=C.getRangeAt(0),d=w.length;if(h.startContainer===g){let T=h.startOffset,S=0;for(let N=0;N<T&&N<g.childNodes.length;N++)S+=g.childNodes[N].textContent?.length||0;d=S||w.length}else if(h.startContainer.nodeType===Node.TEXT_NODE){let T=document.createTreeWalker(g,NodeFilter.SHOW_TEXT,null),S=0,N=!1,P=T.nextNode();for(;P;){if(P===h.startContainer){S+=h.startOffset,N=!0;break}S+=P.textContent?.length||0,P=T.nextNode()}d=N?S:w.length}let c=d===0&&w.length>0?w.length:d,p=w.substring(0,c),b=p.lastIndexOf("@"),y=p.lastIndexOf("/"),k=-1,_=null;if(b>y?(k=b,_="@"):y>b&&(k=y,_="/"),k>=0&&_){let T=k>0?w[k-1]:" ";if(T===" "||T===`
`||k===0){let N=w.substring(k+1,c);if(!N.includes(" ")&&!N.includes(`
`)){let P=v();if(P){await l(_,N,P);return}}}}u.isOpen&&s()};return g.addEventListener("input",x),()=>g.removeEventListener("input",x)},[e,u.isOpen,l,s]),{isOpen:u.isOpen,triggerChar:u.triggerChar,query:u.query,position:u.position,items:u.items,closeCompletion:s,openCompletion:l,refreshCompletion:m}}var ya=A(D(),1);var hl=({size:e=16,className:n,...t})=>(0,ya.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,ya.jsx)("path",{d:"M9 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7l-5-5zm3 7V3.5L10.5 2H10v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1zM6 3h3v2H6V3z"})});var In=A(D(),1);var gl=({size:e=20,className:n,...t})=>(0,In.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,In.jsx)("path",{fillRule:"evenodd",d:"M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",clipRule:"evenodd"})}),xl=({size:e=20,className:n,...t})=>(0,In.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,In.jsx)("path",{d:"M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"})});var vl=({size:e=20,className:n,...t})=>(0,In.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,In.jsx)("path",{fillRule:"evenodd",d:"M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z",clipRule:"evenodd"})});var bl=({size:e=20,className:n,...t})=>(0,In.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,In.jsx)("path",{fillRule:"evenodd",d:"M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z",clipRule:"evenodd"})});var _e=A(D(),1);var yl=({size:e=16,className:n,...t})=>(0,_e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,_e.jsx)("path",{fillRule:"evenodd",d:"M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.596l-2.047.848a.75.75 0 0 1-.98-.98l.848-2.047a2.75 2.75 0 0 1 .596-.892l7.262-7.261Z",clipRule:"evenodd"})}),wa=({size:e=16,className:n,...t})=>(0,_e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,_e.jsx)("path",{d:"M2.53 3.956A1 1 0 0 0 1 4.804v6.392a1 1 0 0 0 1.53.848l5.113-3.196c.16-.1.279-.233.357-.383v2.73a1 1 0 0 0 1.53.849l5.113-3.196a1 1 0 0 0 0-1.696L9.53 3.956A1 1 0 0 0 8 4.804v2.731a.992.992 0 0 0-.357-.383L2.53 3.956Z"})}),wl=({size:e=16,className:n,...t})=>(0,_e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,_e.jsx)("path",{d:"M4.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-1ZM10.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-1Z"})}),kl=({size:e=20,className:n,...t})=>(0,_e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,_e.jsx)("path",{fillRule:"evenodd",d:"M6.28 5.22a.75.75 0 0 1 0 1.06L2.56 10l3.72 3.72a.75.75 0 0 1-1.06 1.06L.97 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Zm7.44 0a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 0 1 0-1.06ZM11.377 2.011a.75.75 0 0 1 .612.867l-2.5 14.5a.75.75 0 0 1-1.478-.255l2.5-14.5a.75.75 0 0 1 .866-.612Z",clipRule:"evenodd"})}),Cl=({size:e=20,className:n,...t})=>(0,_e.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:[(0,_e.jsx)("path",{fillRule:"evenodd",d:"M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z",clipRule:"evenodd"}),(0,_e.jsx)("path",{d:"m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z"})]}),_l=({size:e=20,className:n,...t})=>(0,_e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,_e.jsx)("path",{fillRule:"evenodd",d:"M12.528 3.047a.75.75 0 0 1 .449.961L8.433 16.504a.75.75 0 1 1-1.41-.512l4.544-12.496a.75.75 0 0 1 .961-.449Z",clipRule:"evenodd"})}),Sl=({size:e=20,className:n,...t})=>(0,_e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,_e.jsx)("path",{fillRule:"evenodd",d:"M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z",clipRule:"evenodd"})});var ka=A(D(),1);var El=({size:e=16,className:n,...t})=>(0,ka.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,ka.jsx)("path",{d:"M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"})});var pm=A(D(),1);var Tl=A(D(),1);var Al=({size:e=16,className:n,...t})=>(0,Tl.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",width:e,height:e,className:n,"aria-hidden":"true",...t,children:(0,Tl.jsx)("rect",{x:"4",y:"4",width:"8",height:"8",rx:"1"})});var nt=A(D(),1);var fm=({currentSessionTitle:e,onLoadSessions:n,onNewSession:t})=>(0,nt.jsxs)("div",{className:"chat-header flex items-center select-none w-full border-b border-[var(--app-primary-border-color)] bg-[var(--app-header-background)] py-1.5 px-2.5",style:{borderBottom:"1px solid var(--app-primary-border-color)"},children:[(0,nt.jsxs)("button",{className:"flex items-center gap-1.5 py-0.5 px-2 bg-transparent border-none rounded cursor-pointer outline-none min-w-0 max-w-[300px] overflow-hidden text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] hover:bg-[var(--app-ghost-button-hover-background)] focus:bg-[var(--app-ghost-button-hover-background)]",onClick:n,title:"Past conversations",children:[(0,nt.jsx)("span",{className:"whitespace-nowrap overflow-hidden text-ellipsis min-w-0 font-medium",children:e}),(0,nt.jsx)(gl,{className:"w-4 h-4 flex-shrink-0"})]}),(0,nt.jsx)("div",{className:"flex-1 min-w-1"}),(0,nt.jsx)("button",{className:"flex items-center justify-center p-1 bg-transparent border-none rounded cursor-pointer outline-none hover:bg-[var(--app-ghost-button-hover-background)]",onClick:t,title:"New Session",style:{padding:"4px"},children:(0,nt.jsx)(xl,{className:"w-4 h-4"})})]});var zl={};Qo(zl,{arrayReplaceAt:()=>Ll,assign:()=>Br,escapeHtml:()=>rt,escapeRE:()=>hx,fromCodePoint:()=>qo,has:()=>ox,isMdAsciiPunct:()=>Kt,isPunctChar:()=>Yt,isSpace:()=>B,isString:()=>Ma,isValidEntityCode:()=>Pa,isWhiteSpace:()=>Xt,lib:()=>gx,normalizeReference:()=>Jt,unescapeAll:()=>tt,unescapeMd:()=>lx});var Ta={};Qo(Ta,{decode:()=>Uo,encode:()=>Sa,format:()=>zr,parse:()=>jo});var mm={};function I2(e){let n=mm[e];if(n)return n;n=mm[e]=[];for(let t=0;t<128;t++){let r=String.fromCharCode(t);n.push(r)}for(let t=0;t<e.length;t++){let r=e.charCodeAt(t);n[r]="%"+("0"+r.toString(16).toUpperCase()).slice(-2)}return n}function Ca(e,n){typeof n!="string"&&(n=Ca.defaultChars);let t=I2(n);return e.replace(/(%[a-f0-9]{2})+/gi,function(r){let o="";for(let u=0,a=r.length;u<a;u+=3){let i=parseInt(r.slice(u+1,u+3),16);if(i<128){o+=t[i];continue}if((i&224)===192&&u+3<a){let s=parseInt(r.slice(u+4,u+6),16);if((s&192)===128){let l=i<<6&1984|s&63;l<128?o+="\uFFFD\uFFFD":o+=String.fromCharCode(l),u+=3;continue}}if((i&240)===224&&u+6<a){let s=parseInt(r.slice(u+4,u+6),16),l=parseInt(r.slice(u+7,u+9),16);if((s&192)===128&&(l&192)===128){let f=i<<12&61440|s<<6&4032|l&63;f<2048||f>=55296&&f<=57343?o+="\uFFFD\uFFFD\uFFFD":o+=String.fromCharCode(f),u+=6;continue}}if((i&248)===240&&u+9<a){let s=parseInt(r.slice(u+4,u+6),16),l=parseInt(r.slice(u+7,u+9),16),f=parseInt(r.slice(u+10,u+12),16);if((s&192)===128&&(l&192)===128&&(f&192)===128){let m=i<<18&1835008|s<<12&258048|l<<6&4032|f&63;m<65536||m>1114111?o+="\uFFFD\uFFFD\uFFFD\uFFFD":(m-=65536,o+=String.fromCharCode(55296+(m>>10),56320+(m&1023))),u+=9;continue}}o+="\uFFFD"}return o})}Ca.defaultChars=";/?:@&=+$,#";Ca.componentChars="";var Uo=Ca;var hm={};function M2(e){let n=hm[e];if(n)return n;n=hm[e]=[];for(let t=0;t<128;t++){let r=String.fromCharCode(t);/^[0-9a-z]$/i.test(r)?n.push(r):n.push("%"+("0"+t.toString(16).toUpperCase()).slice(-2))}for(let t=0;t<e.length;t++)n[e.charCodeAt(t)]=e[t];return n}function _a(e,n,t){typeof n!="string"&&(t=n,n=_a.defaultChars),typeof t>"u"&&(t=!0);let r=M2(n),o="";for(let u=0,a=e.length;u<a;u++){let i=e.charCodeAt(u);if(t&&i===37&&u+2<a&&/^[0-9a-f]{2}$/i.test(e.slice(u+1,u+3))){o+=e.slice(u,u+3),u+=2;continue}if(i<128){o+=r[i];continue}if(i>=55296&&i<=57343){if(i>=55296&&i<=56319&&u+1<a){let s=e.charCodeAt(u+1);if(s>=56320&&s<=57343){o+=encodeURIComponent(e[u]+e[u+1]),u++;continue}}o+="%EF%BF%BD";continue}o+=encodeURIComponent(e[u])}return o}_a.defaultChars=";/?:@&=+$,-_.!~*'()#";_a.componentChars="-_.!~*'()";var Sa=_a;function zr(e){let n="";return n+=e.protocol||"",n+=e.slashes?"//":"",n+=e.auth?e.auth+"@":"",e.hostname&&e.hostname.indexOf(":")!==-1?n+="["+e.hostname+"]":n+=e.hostname||"",n+=e.port?":"+e.port:"",n+=e.pathname||"",n+=e.search||"",n+=e.hash||"",n}function Ea(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}var P2=/^([a-z0-9.+-]+:)/i,L2=/:[0-9]*$/,z2=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,O2=["<",">",'"',"`"," ","\r",`
`,"	"],B2=["{","}","|","\\","^","`"].concat(O2),U2=["'"].concat(B2),gm=["%","/","?",";","#"].concat(U2),xm=["/","?","#"],j2=255,vm=/^[+a-z0-9A-Z_-]{0,63}$/,q2=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,bm={javascript:!0,"javascript:":!0},ym={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};function H2(e,n){if(e&&e instanceof Ea)return e;let t=new Ea;return t.parse(e,n),t}Ea.prototype.parse=function(e,n){let t,r,o,u=e;if(u=u.trim(),!n&&e.split("#").length===1){let l=z2.exec(u);if(l)return this.pathname=l[1],l[2]&&(this.search=l[2]),this}let a=P2.exec(u);if(a&&(a=a[0],t=a.toLowerCase(),this.protocol=a,u=u.substr(a.length)),(n||a||u.match(/^\/\/[^@\/]+@[^@\/]+/))&&(o=u.substr(0,2)==="//",o&&!(a&&bm[a])&&(u=u.substr(2),this.slashes=!0)),!bm[a]&&(o||a&&!ym[a])){let l=-1;for(let x=0;x<xm.length;x++)r=u.indexOf(xm[x]),r!==-1&&(l===-1||r<l)&&(l=r);let f,m;l===-1?m=u.lastIndexOf("@"):m=u.lastIndexOf("@",l),m!==-1&&(f=u.slice(0,m),u=u.slice(m+1),this.auth=f),l=-1;for(let x=0;x<gm.length;x++)r=u.indexOf(gm[x]),r!==-1&&(l===-1||r<l)&&(l=r);l===-1&&(l=u.length),u[l-1]===":"&&l--;let g=u.slice(0,l);u=u.slice(l),this.parseHost(g),this.hostname=this.hostname||"";let v=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!v){let x=this.hostname.split(/\./);for(let w=0,C=x.length;w<C;w++){let h=x[w];if(h&&!h.match(vm)){let d="";for(let c=0,p=h.length;c<p;c++)h.charCodeAt(c)>127?d+="x":d+=h[c];if(!d.match(vm)){let c=x.slice(0,w),p=x.slice(w+1),b=h.match(q2);b&&(c.push(b[1]),p.unshift(b[2])),p.length&&(u=p.join(".")+u),this.hostname=c.join(".");break}}}}this.hostname.length>j2&&(this.hostname=""),v&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}let i=u.indexOf("#");i!==-1&&(this.hash=u.substr(i),u=u.slice(0,i));let s=u.indexOf("?");return s!==-1&&(this.search=u.substr(s),u=u.slice(0,s)),u&&(this.pathname=u),ym[t]&&this.hostname&&!this.pathname&&(this.pathname=""),this};Ea.prototype.parseHost=function(e){let n=L2.exec(e);n&&(n=n[0],n!==":"&&(this.port=n.substr(1)),e=e.substr(0,e.length-n.length)),e&&(this.hostname=e)};var jo=H2;var Dl={};Qo(Dl,{Any:()=>Aa,Cc:()=>Da,Cf:()=>wm,P:()=>Or,S:()=>Fa,Z:()=>Na});var Aa=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;var Da=/[\0-\x1F\x7F-\x9F]/;var wm=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;var Or=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;var Fa=/[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/;var Na=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;var km=new Uint16Array('\u1D41<\xD5\u0131\u028A\u049D\u057B\u05D0\u0675\u06DE\u07A2\u07D6\u080F\u0A4A\u0A91\u0DA1\u0E6D\u0F09\u0F26\u10CA\u1228\u12E1\u1415\u149D\u14C3\u14DF\u1525\0\0\0\0\0\0\u156B\u16CD\u198D\u1C12\u1DDD\u1F7E\u2060\u21B0\u228D\u23C0\u23FB\u2442\u2824\u2912\u2D08\u2E48\u2FCE\u3016\u32BA\u3639\u37AC\u38FE\u3A28\u3A71\u3AE0\u3B2E\u0800EMabcfglmnoprstu\\bfms\x7F\x84\x8B\x90\x95\x98\xA6\xB3\xB9\xC8\xCFlig\u803B\xC6\u40C6P\u803B&\u4026cute\u803B\xC1\u40C1reve;\u4102\u0100iyx}rc\u803B\xC2\u40C2;\u4410r;\uC000\u{1D504}rave\u803B\xC0\u40C0pha;\u4391acr;\u4100d;\u6A53\u0100gp\x9D\xA1on;\u4104f;\uC000\u{1D538}plyFunction;\u6061ing\u803B\xC5\u40C5\u0100cs\xBE\xC3r;\uC000\u{1D49C}ign;\u6254ilde\u803B\xC3\u40C3ml\u803B\xC4\u40C4\u0400aceforsu\xE5\xFB\xFE\u0117\u011C\u0122\u0127\u012A\u0100cr\xEA\xF2kslash;\u6216\u0176\xF6\xF8;\u6AE7ed;\u6306y;\u4411\u0180crt\u0105\u010B\u0114ause;\u6235noullis;\u612Ca;\u4392r;\uC000\u{1D505}pf;\uC000\u{1D539}eve;\u42D8c\xF2\u0113mpeq;\u624E\u0700HOacdefhilorsu\u014D\u0151\u0156\u0180\u019E\u01A2\u01B5\u01B7\u01BA\u01DC\u0215\u0273\u0278\u027Ecy;\u4427PY\u803B\xA9\u40A9\u0180cpy\u015D\u0162\u017Aute;\u4106\u0100;i\u0167\u0168\u62D2talDifferentialD;\u6145leys;\u612D\u0200aeio\u0189\u018E\u0194\u0198ron;\u410Cdil\u803B\xC7\u40C7rc;\u4108nint;\u6230ot;\u410A\u0100dn\u01A7\u01ADilla;\u40B8terDot;\u40B7\xF2\u017Fi;\u43A7rcle\u0200DMPT\u01C7\u01CB\u01D1\u01D6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01E2\u01F8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020FoubleQuote;\u601Duote;\u6019\u0200lnpu\u021E\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6A74\u0180git\u022F\u0236\u023Aruent;\u6261nt;\u622FourIntegral;\u622E\u0100fr\u024C\u024E;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6A2Fcr;\uC000\u{1D49E}p\u0100;C\u0284\u0285\u62D3ap;\u624D\u0580DJSZacefios\u02A0\u02AC\u02B0\u02B4\u02B8\u02CB\u02D7\u02E1\u02E6\u0333\u048D\u0100;o\u0179\u02A5trahd;\u6911cy;\u4402cy;\u4405cy;\u440F\u0180grs\u02BF\u02C4\u02C7ger;\u6021r;\u61A1hv;\u6AE4\u0100ay\u02D0\u02D5ron;\u410E;\u4414l\u0100;t\u02DD\u02DE\u6207a;\u4394r;\uC000\u{1D507}\u0100af\u02EB\u0327\u0100cm\u02F0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031Ccute;\u40B4o\u0174\u030B\u030D;\u42D9bleAcute;\u42DDrave;\u4060ilde;\u42DCond;\u62C4ferentialD;\u6146\u0470\u033D\0\0\0\u0342\u0354\0\u0405f;\uC000\u{1D53B}\u0180;DE\u0348\u0349\u034D\u40A8ot;\u60DCqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03CF\u03E2\u03F8ontourIntegra\xEC\u0239o\u0274\u0379\0\0\u037B\xBB\u0349nArrow;\u61D3\u0100eo\u0387\u03A4ft\u0180ART\u0390\u0396\u03A1rrow;\u61D0ightArrow;\u61D4e\xE5\u02CAng\u0100LR\u03AB\u03C4eft\u0100AR\u03B3\u03B9rrow;\u67F8ightArrow;\u67FAightArrow;\u67F9ight\u0100AT\u03D8\u03DErrow;\u61D2ee;\u62A8p\u0241\u03E9\0\0\u03EFrrow;\u61D1ownArrow;\u61D5erticalBar;\u6225n\u0300ABLRTa\u0412\u042A\u0430\u045E\u047F\u037Crrow\u0180;BU\u041D\u041E\u0422\u6193ar;\u6913pArrow;\u61F5reve;\u4311eft\u02D2\u043A\0\u0446\0\u0450ightVector;\u6950eeVector;\u695Eector\u0100;B\u0459\u045A\u61BDar;\u6956ight\u01D4\u0467\0\u0471eeVector;\u695Fector\u0100;B\u047A\u047B\u61C1ar;\u6957ee\u0100;A\u0486\u0487\u62A4rrow;\u61A7\u0100ct\u0492\u0497r;\uC000\u{1D49F}rok;\u4110\u0800NTacdfglmopqstux\u04BD\u04C0\u04C4\u04CB\u04DE\u04E2\u04E7\u04EE\u04F5\u0521\u052F\u0536\u0552\u055D\u0560\u0565G;\u414AH\u803B\xD0\u40D0cute\u803B\xC9\u40C9\u0180aiy\u04D2\u04D7\u04DCron;\u411Arc\u803B\xCA\u40CA;\u442Dot;\u4116r;\uC000\u{1D508}rave\u803B\xC8\u40C8ement;\u6208\u0100ap\u04FA\u04FEcr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65FBerySmallSquare;\u65AB\u0100gp\u0526\u052Aon;\u4118f;\uC000\u{1D53C}silon;\u4395u\u0100ai\u053C\u0549l\u0100;T\u0542\u0543\u6A75ilde;\u6242librium;\u61CC\u0100ci\u0557\u055Ar;\u6130m;\u6A73a;\u4397ml\u803B\xCB\u40CB\u0100ip\u056A\u056Fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058D\u05B2\u05CCy;\u4424r;\uC000\u{1D509}lled\u0253\u0597\0\0\u05A3mallSquare;\u65FCerySmallSquare;\u65AA\u0370\u05BA\0\u05BF\0\0\u05C4f;\uC000\u{1D53D}All;\u6200riertrf;\u6131c\xF2\u05CB\u0600JTabcdfgorst\u05E8\u05EC\u05EF\u05FA\u0600\u0612\u0616\u061B\u061D\u0623\u066C\u0672cy;\u4403\u803B>\u403Emma\u0100;d\u05F7\u05F8\u4393;\u43DCreve;\u411E\u0180eiy\u0607\u060C\u0610dil;\u4122rc;\u411C;\u4413ot;\u4120r;\uC000\u{1D50A};\u62D9pf;\uC000\u{1D53E}eater\u0300EFGLST\u0635\u0644\u064E\u0656\u065B\u0666qual\u0100;L\u063E\u063F\u6265ess;\u62DBullEqual;\u6267reater;\u6AA2ess;\u6277lantEqual;\u6A7Eilde;\u6273cr;\uC000\u{1D4A2};\u626B\u0400Aacfiosu\u0685\u068B\u0696\u069B\u069E\u06AA\u06BE\u06CARDcy;\u442A\u0100ct\u0690\u0694ek;\u42C7;\u405Eirc;\u4124r;\u610ClbertSpace;\u610B\u01F0\u06AF\0\u06B2f;\u610DizontalLine;\u6500\u0100ct\u06C3\u06C5\xF2\u06A9rok;\u4126mp\u0144\u06D0\u06D8ownHum\xF0\u012Fqual;\u624F\u0700EJOacdfgmnostu\u06FA\u06FE\u0703\u0707\u070E\u071A\u071E\u0721\u0728\u0744\u0778\u078B\u078F\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803B\xCD\u40CD\u0100iy\u0713\u0718rc\u803B\xCE\u40CE;\u4418ot;\u4130r;\u6111rave\u803B\xCC\u40CC\u0180;ap\u0720\u072F\u073F\u0100cg\u0734\u0737r;\u412AinaryI;\u6148lie\xF3\u03DD\u01F4\u0749\0\u0762\u0100;e\u074D\u074E\u622C\u0100gr\u0753\u0758ral;\u622Bsection;\u62C2isible\u0100CT\u076C\u0772omma;\u6063imes;\u6062\u0180gpt\u077F\u0783\u0788on;\u412Ef;\uC000\u{1D540}a;\u4399cr;\u6110ilde;\u4128\u01EB\u079A\0\u079Ecy;\u4406l\u803B\xCF\u40CF\u0280cfosu\u07AC\u07B7\u07BC\u07C2\u07D0\u0100iy\u07B1\u07B5rc;\u4134;\u4419r;\uC000\u{1D50D}pf;\uC000\u{1D541}\u01E3\u07C7\0\u07CCr;\uC000\u{1D4A5}rcy;\u4408kcy;\u4404\u0380HJacfos\u07E4\u07E8\u07EC\u07F1\u07FD\u0802\u0808cy;\u4425cy;\u440Cppa;\u439A\u0100ey\u07F6\u07FBdil;\u4136;\u441Ar;\uC000\u{1D50E}pf;\uC000\u{1D542}cr;\uC000\u{1D4A6}\u0580JTaceflmost\u0825\u0829\u082C\u0850\u0863\u09B3\u09B8\u09C7\u09CD\u0A37\u0A47cy;\u4409\u803B<\u403C\u0280cmnpr\u0837\u083C\u0841\u0844\u084Dute;\u4139bda;\u439Bg;\u67EAlacetrf;\u6112r;\u619E\u0180aey\u0857\u085C\u0861ron;\u413Ddil;\u413B;\u441B\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087E\u08A9\u08B1\u08E0\u08E6\u08FC\u092F\u095B\u0390\u096A\u0100nr\u0883\u088FgleBracket;\u67E8row\u0180;BR\u0899\u089A\u089E\u6190ar;\u61E4ightArrow;\u61C6eiling;\u6308o\u01F5\u08B7\0\u08C3bleBracket;\u67E6n\u01D4\u08C8\0\u08D2eeVector;\u6961ector\u0100;B\u08DB\u08DC\u61C3ar;\u6959loor;\u630Aight\u0100AV\u08EF\u08F5rrow;\u6194ector;\u694E\u0100er\u0901\u0917e\u0180;AV\u0909\u090A\u0910\u62A3rrow;\u61A4ector;\u695Aiangle\u0180;BE\u0924\u0925\u0929\u62B2ar;\u69CFqual;\u62B4p\u0180DTV\u0937\u0942\u094CownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61BFar;\u6958ector\u0100;B\u0965\u0966\u61BCar;\u6952ight\xE1\u039Cs\u0300EFGLST\u097E\u098B\u0995\u099D\u09A2\u09ADqualGreater;\u62DAullEqual;\u6266reater;\u6276ess;\u6AA1lantEqual;\u6A7Dilde;\u6272r;\uC000\u{1D50F}\u0100;e\u09BD\u09BE\u62D8ftarrow;\u61DAidot;\u413F\u0180npw\u09D4\u0A16\u0A1Bg\u0200LRlr\u09DE\u09F7\u0A02\u0A10eft\u0100AR\u09E6\u09ECrrow;\u67F5ightArrow;\u67F7ightArrow;\u67F6eft\u0100ar\u03B3\u0A0Aight\xE1\u03BFight\xE1\u03CAf;\uC000\u{1D543}er\u0100LR\u0A22\u0A2CeftArrow;\u6199ightArrow;\u6198\u0180cht\u0A3E\u0A40\u0A42\xF2\u084C;\u61B0rok;\u4141;\u626A\u0400acefiosu\u0A5A\u0A5D\u0A60\u0A77\u0A7C\u0A85\u0A8B\u0A8Ep;\u6905y;\u441C\u0100dl\u0A65\u0A6FiumSpace;\u605Flintrf;\u6133r;\uC000\u{1D510}nusPlus;\u6213pf;\uC000\u{1D544}c\xF2\u0A76;\u439C\u0480Jacefostu\u0AA3\u0AA7\u0AAD\u0AC0\u0B14\u0B19\u0D91\u0D97\u0D9Ecy;\u440Acute;\u4143\u0180aey\u0AB4\u0AB9\u0ABEron;\u4147dil;\u4145;\u441D\u0180gsw\u0AC7\u0AF0\u0B0Eative\u0180MTV\u0AD3\u0ADF\u0AE8ediumSpace;\u600Bhi\u0100cn\u0AE6\u0AD8\xEB\u0AD9eryThi\xEE\u0AD9ted\u0100GL\u0AF8\u0B06reaterGreate\xF2\u0673essLes\xF3\u0A48Line;\u400Ar;\uC000\u{1D511}\u0200Bnpt\u0B22\u0B28\u0B37\u0B3Areak;\u6060BreakingSpace;\u40A0f;\u6115\u0680;CDEGHLNPRSTV\u0B55\u0B56\u0B6A\u0B7C\u0BA1\u0BEB\u0C04\u0C5E\u0C84\u0CA6\u0CD8\u0D61\u0D85\u6AEC\u0100ou\u0B5B\u0B64ngruent;\u6262pCap;\u626DoubleVerticalBar;\u6226\u0180lqx\u0B83\u0B8A\u0B9Bement;\u6209ual\u0100;T\u0B92\u0B93\u6260ilde;\uC000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0BB6\u0BB7\u0BBD\u0BC9\u0BD3\u0BD8\u0BE5\u626Fqual;\u6271ullEqual;\uC000\u2267\u0338reater;\uC000\u226B\u0338ess;\u6279lantEqual;\uC000\u2A7E\u0338ilde;\u6275ump\u0144\u0BF2\u0BFDownHump;\uC000\u224E\u0338qual;\uC000\u224F\u0338e\u0100fs\u0C0A\u0C27tTriangle\u0180;BE\u0C1A\u0C1B\u0C21\u62EAar;\uC000\u29CF\u0338qual;\u62ECs\u0300;EGLST\u0C35\u0C36\u0C3C\u0C44\u0C4B\u0C58\u626Equal;\u6270reater;\u6278ess;\uC000\u226A\u0338lantEqual;\uC000\u2A7D\u0338ilde;\u6274ested\u0100GL\u0C68\u0C79reaterGreater;\uC000\u2AA2\u0338essLess;\uC000\u2AA1\u0338recedes\u0180;ES\u0C92\u0C93\u0C9B\u6280qual;\uC000\u2AAF\u0338lantEqual;\u62E0\u0100ei\u0CAB\u0CB9verseElement;\u620CghtTriangle\u0180;BE\u0CCB\u0CCC\u0CD2\u62EBar;\uC000\u29D0\u0338qual;\u62ED\u0100qu\u0CDD\u0D0CuareSu\u0100bp\u0CE8\u0CF9set\u0100;E\u0CF0\u0CF3\uC000\u228F\u0338qual;\u62E2erset\u0100;E\u0D03\u0D06\uC000\u2290\u0338qual;\u62E3\u0180bcp\u0D13\u0D24\u0D4Eset\u0100;E\u0D1B\u0D1E\uC000\u2282\u20D2qual;\u6288ceeds\u0200;EST\u0D32\u0D33\u0D3B\u0D46\u6281qual;\uC000\u2AB0\u0338lantEqual;\u62E1ilde;\uC000\u227F\u0338erset\u0100;E\u0D58\u0D5B\uC000\u2283\u20D2qual;\u6289ilde\u0200;EFT\u0D6E\u0D6F\u0D75\u0D7F\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uC000\u{1D4A9}ilde\u803B\xD1\u40D1;\u439D\u0700Eacdfgmoprstuv\u0DBD\u0DC2\u0DC9\u0DD5\u0DDB\u0DE0\u0DE7\u0DFC\u0E02\u0E20\u0E22\u0E32\u0E3F\u0E44lig;\u4152cute\u803B\xD3\u40D3\u0100iy\u0DCE\u0DD3rc\u803B\xD4\u40D4;\u441Eblac;\u4150r;\uC000\u{1D512}rave\u803B\xD2\u40D2\u0180aei\u0DEE\u0DF2\u0DF6cr;\u414Cga;\u43A9cron;\u439Fpf;\uC000\u{1D546}enCurly\u0100DQ\u0E0E\u0E1AoubleQuote;\u601Cuote;\u6018;\u6A54\u0100cl\u0E27\u0E2Cr;\uC000\u{1D4AA}ash\u803B\xD8\u40D8i\u016C\u0E37\u0E3Cde\u803B\xD5\u40D5es;\u6A37ml\u803B\xD6\u40D6er\u0100BP\u0E4B\u0E60\u0100ar\u0E50\u0E53r;\u603Eac\u0100ek\u0E5A\u0E5C;\u63DEet;\u63B4arenthesis;\u63DC\u0480acfhilors\u0E7F\u0E87\u0E8A\u0E8F\u0E92\u0E94\u0E9D\u0EB0\u0EFCrtialD;\u6202y;\u441Fr;\uC000\u{1D513}i;\u43A6;\u43A0usMinus;\u40B1\u0100ip\u0EA2\u0EADncareplan\xE5\u069Df;\u6119\u0200;eio\u0EB9\u0EBA\u0EE0\u0EE4\u6ABBcedes\u0200;EST\u0EC8\u0EC9\u0ECF\u0EDA\u627Aqual;\u6AAFlantEqual;\u627Cilde;\u627Eme;\u6033\u0100dp\u0EE9\u0EEEuct;\u620Fortion\u0100;a\u0225\u0EF9l;\u621D\u0100ci\u0F01\u0F06r;\uC000\u{1D4AB};\u43A8\u0200Ufos\u0F11\u0F16\u0F1B\u0F1FOT\u803B"\u4022r;\uC000\u{1D514}pf;\u611Acr;\uC000\u{1D4AC}\u0600BEacefhiorsu\u0F3E\u0F43\u0F47\u0F60\u0F73\u0FA7\u0FAA\u0FAD\u1096\u10A9\u10B4\u10BEarr;\u6910G\u803B\xAE\u40AE\u0180cnr\u0F4E\u0F53\u0F56ute;\u4154g;\u67EBr\u0100;t\u0F5C\u0F5D\u61A0l;\u6916\u0180aey\u0F67\u0F6C\u0F71ron;\u4158dil;\u4156;\u4420\u0100;v\u0F78\u0F79\u611Cerse\u0100EU\u0F82\u0F99\u0100lq\u0F87\u0F8Eement;\u620Builibrium;\u61CBpEquilibrium;\u696Fr\xBB\u0F79o;\u43A1ght\u0400ACDFTUVa\u0FC1\u0FEB\u0FF3\u1022\u1028\u105B\u1087\u03D8\u0100nr\u0FC6\u0FD2gleBracket;\u67E9row\u0180;BL\u0FDC\u0FDD\u0FE1\u6192ar;\u61E5eftArrow;\u61C4eiling;\u6309o\u01F5\u0FF9\0\u1005bleBracket;\u67E7n\u01D4\u100A\0\u1014eeVector;\u695Dector\u0100;B\u101D\u101E\u61C2ar;\u6955loor;\u630B\u0100er\u102D\u1043e\u0180;AV\u1035\u1036\u103C\u62A2rrow;\u61A6ector;\u695Biangle\u0180;BE\u1050\u1051\u1055\u62B3ar;\u69D0qual;\u62B5p\u0180DTV\u1063\u106E\u1078ownVector;\u694FeeVector;\u695Cector\u0100;B\u1082\u1083\u61BEar;\u6954ector\u0100;B\u1091\u1092\u61C0ar;\u6953\u0100pu\u109B\u109Ef;\u611DndImplies;\u6970ightarrow;\u61DB\u0100ch\u10B9\u10BCr;\u611B;\u61B1leDelayed;\u69F4\u0680HOacfhimoqstu\u10E4\u10F1\u10F7\u10FD\u1119\u111E\u1151\u1156\u1161\u1167\u11B5\u11BB\u11BF\u0100Cc\u10E9\u10EEHcy;\u4429y;\u4428FTcy;\u442Ccute;\u415A\u0280;aeiy\u1108\u1109\u110E\u1113\u1117\u6ABCron;\u4160dil;\u415Erc;\u415C;\u4421r;\uC000\u{1D516}ort\u0200DLRU\u112A\u1134\u113E\u1149ownArrow\xBB\u041EeftArrow\xBB\u089AightArrow\xBB\u0FDDpArrow;\u6191gma;\u43A3allCircle;\u6218pf;\uC000\u{1D54A}\u0272\u116D\0\0\u1170t;\u621Aare\u0200;ISU\u117B\u117C\u1189\u11AF\u65A1ntersection;\u6293u\u0100bp\u118F\u119Eset\u0100;E\u1197\u1198\u628Fqual;\u6291erset\u0100;E\u11A8\u11A9\u6290qual;\u6292nion;\u6294cr;\uC000\u{1D4AE}ar;\u62C6\u0200bcmp\u11C8\u11DB\u1209\u120B\u0100;s\u11CD\u11CE\u62D0et\u0100;E\u11CD\u11D5qual;\u6286\u0100ch\u11E0\u1205eeds\u0200;EST\u11ED\u11EE\u11F4\u11FF\u627Bqual;\u6AB0lantEqual;\u627Dilde;\u627FTh\xE1\u0F8C;\u6211\u0180;es\u1212\u1213\u1223\u62D1rset\u0100;E\u121C\u121D\u6283qual;\u6287et\xBB\u1213\u0580HRSacfhiors\u123E\u1244\u1249\u1255\u125E\u1271\u1276\u129F\u12C2\u12C8\u12D1ORN\u803B\xDE\u40DEADE;\u6122\u0100Hc\u124E\u1252cy;\u440By;\u4426\u0100bu\u125A\u125C;\u4009;\u43A4\u0180aey\u1265\u126A\u126Fron;\u4164dil;\u4162;\u4422r;\uC000\u{1D517}\u0100ei\u127B\u1289\u01F2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128E\u1298kSpace;\uC000\u205F\u200ASpace;\u6009lde\u0200;EFT\u12AB\u12AC\u12B2\u12BC\u623Cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uC000\u{1D54B}ipleDot;\u60DB\u0100ct\u12D6\u12DBr;\uC000\u{1D4AF}rok;\u4166\u0AE1\u12F7\u130E\u131A\u1326\0\u132C\u1331\0\0\0\0\0\u1338\u133D\u1377\u1385\0\u13FF\u1404\u140A\u1410\u0100cr\u12FB\u1301ute\u803B\xDA\u40DAr\u0100;o\u1307\u1308\u619Fcir;\u6949r\u01E3\u1313\0\u1316y;\u440Eve;\u416C\u0100iy\u131E\u1323rc\u803B\xDB\u40DB;\u4423blac;\u4170r;\uC000\u{1D518}rave\u803B\xD9\u40D9acr;\u416A\u0100di\u1341\u1369er\u0100BP\u1348\u135D\u0100ar\u134D\u1350r;\u405Fac\u0100ek\u1357\u1359;\u63DFet;\u63B5arenthesis;\u63DDon\u0100;P\u1370\u1371\u62C3lus;\u628E\u0100gp\u137B\u137Fon;\u4172f;\uC000\u{1D54C}\u0400ADETadps\u1395\u13AE\u13B8\u13C4\u03E8\u13D2\u13D7\u13F3rrow\u0180;BD\u1150\u13A0\u13A4ar;\u6912ownArrow;\u61C5ownArrow;\u6195quilibrium;\u696Eee\u0100;A\u13CB\u13CC\u62A5rrow;\u61A5own\xE1\u03F3er\u0100LR\u13DE\u13E8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13F9\u13FA\u43D2on;\u43A5ing;\u416Ecr;\uC000\u{1D4B0}ilde;\u4168ml\u803B\xDC\u40DC\u0480Dbcdefosv\u1427\u142C\u1430\u1433\u143E\u1485\u148A\u1490\u1496ash;\u62ABar;\u6AEBy;\u4412ash\u0100;l\u143B\u143C\u62A9;\u6AE6\u0100er\u1443\u1445;\u62C1\u0180bty\u144C\u1450\u147Aar;\u6016\u0100;i\u144F\u1455cal\u0200BLST\u1461\u1465\u146A\u1474ar;\u6223ine;\u407Ceparator;\u6758ilde;\u6240ThinSpace;\u600Ar;\uC000\u{1D519}pf;\uC000\u{1D54D}cr;\uC000\u{1D4B1}dash;\u62AA\u0280cefos\u14A7\u14AC\u14B1\u14B6\u14BCirc;\u4174dge;\u62C0r;\uC000\u{1D51A}pf;\uC000\u{1D54E}cr;\uC000\u{1D4B2}\u0200fios\u14CB\u14D0\u14D2\u14D8r;\uC000\u{1D51B};\u439Epf;\uC000\u{1D54F}cr;\uC000\u{1D4B3}\u0480AIUacfosu\u14F1\u14F5\u14F9\u14FD\u1504\u150F\u1514\u151A\u1520cy;\u442Fcy;\u4407cy;\u442Ecute\u803B\xDD\u40DD\u0100iy\u1509\u150Drc;\u4176;\u442Br;\uC000\u{1D51C}pf;\uC000\u{1D550}cr;\uC000\u{1D4B4}ml;\u4178\u0400Hacdefos\u1535\u1539\u153F\u154B\u154F\u155D\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417D;\u4417ot;\u417B\u01F2\u1554\0\u155BoWidt\xE8\u0AD9a;\u4396r;\u6128pf;\u6124cr;\uC000\u{1D4B5}\u0BE1\u1583\u158A\u1590\0\u15B0\u15B6\u15BF\0\0\0\0\u15C6\u15DB\u15EB\u165F\u166D\0\u1695\u169B\u16B2\u16B9\0\u16BEcute\u803B\xE1\u40E1reve;\u4103\u0300;Ediuy\u159C\u159D\u15A1\u15A3\u15A8\u15AD\u623E;\uC000\u223E\u0333;\u623Frc\u803B\xE2\u40E2te\u80BB\xB4\u0306;\u4430lig\u803B\xE6\u40E6\u0100;r\xB2\u15BA;\uC000\u{1D51E}rave\u803B\xE0\u40E0\u0100ep\u15CA\u15D6\u0100fp\u15CF\u15D4sym;\u6135\xE8\u15D3ha;\u43B1\u0100ap\u15DFc\u0100cl\u15E4\u15E7r;\u4101g;\u6A3F\u0264\u15F0\0\0\u160A\u0280;adsv\u15FA\u15FB\u15FF\u1601\u1607\u6227nd;\u6A55;\u6A5Clope;\u6A58;\u6A5A\u0380;elmrsz\u1618\u1619\u161B\u161E\u163F\u164F\u1659\u6220;\u69A4e\xBB\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163A\u163C\u163E;\u69A8;\u69A9;\u69AA;\u69AB;\u69AC;\u69AD;\u69AE;\u69AFt\u0100;v\u1645\u1646\u621Fb\u0100;d\u164C\u164D\u62BE;\u699D\u0100pt\u1654\u1657h;\u6222\xBB\xB9arr;\u637C\u0100gp\u1663\u1667on;\u4105f;\uC000\u{1D552}\u0380;Eaeiop\u12C1\u167B\u167D\u1682\u1684\u1687\u168A;\u6A70cir;\u6A6F;\u624Ad;\u624Bs;\u4027rox\u0100;e\u12C1\u1692\xF1\u1683ing\u803B\xE5\u40E5\u0180cty\u16A1\u16A6\u16A8r;\uC000\u{1D4B6};\u402Amp\u0100;e\u12C1\u16AF\xF1\u0288ilde\u803B\xE3\u40E3ml\u803B\xE4\u40E4\u0100ci\u16C2\u16C8onin\xF4\u0272nt;\u6A11\u0800Nabcdefiklnoprsu\u16ED\u16F1\u1730\u173C\u1743\u1748\u1778\u177D\u17E0\u17E6\u1839\u1850\u170D\u193D\u1948\u1970ot;\u6AED\u0100cr\u16F6\u171Ek\u0200ceps\u1700\u1705\u170D\u1713ong;\u624Cpsilon;\u43F6rime;\u6035im\u0100;e\u171A\u171B\u623Dq;\u62CD\u0176\u1722\u1726ee;\u62BDed\u0100;g\u172C\u172D\u6305e\xBB\u172Drk\u0100;t\u135C\u1737brk;\u63B6\u0100oy\u1701\u1741;\u4431quo;\u601E\u0280cmprt\u1753\u175B\u1761\u1764\u1768aus\u0100;e\u010A\u0109ptyv;\u69B0s\xE9\u170Cno\xF5\u0113\u0180ahw\u176F\u1771\u1773;\u43B2;\u6136een;\u626Cr;\uC000\u{1D51F}g\u0380costuvw\u178D\u179D\u17B3\u17C1\u17D5\u17DB\u17DE\u0180aiu\u1794\u1796\u179A\xF0\u0760rc;\u65EFp\xBB\u1371\u0180dpt\u17A4\u17A8\u17ADot;\u6A00lus;\u6A01imes;\u6A02\u0271\u17B9\0\0\u17BEcup;\u6A06ar;\u6605riangle\u0100du\u17CD\u17D2own;\u65BDp;\u65B3plus;\u6A04e\xE5\u1444\xE5\u14ADarow;\u690D\u0180ako\u17ED\u1826\u1835\u0100cn\u17F2\u1823k\u0180lst\u17FA\u05AB\u1802ozenge;\u69EBriangle\u0200;dlr\u1812\u1813\u1818\u181D\u65B4own;\u65BEeft;\u65C2ight;\u65B8k;\u6423\u01B1\u182B\0\u1833\u01B2\u182F\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183E\u184D\u0100;q\u1843\u1846\uC000=\u20E5uiv;\uC000\u2261\u20E5t;\u6310\u0200ptwx\u1859\u185E\u1867\u186Cf;\uC000\u{1D553}\u0100;t\u13CB\u1863om\xBB\u13CCtie;\u62C8\u0600DHUVbdhmptuv\u1885\u1896\u18AA\u18BB\u18D7\u18DB\u18EC\u18FF\u1905\u190A\u1910\u1921\u0200LRlr\u188E\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18A1\u18A2\u18A4\u18A6\u18A8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18B3\u18B5\u18B7\u18B9;\u655D;\u655A;\u655C;\u6559\u0380;HLRhlr\u18CA\u18CB\u18CD\u18CF\u18D1\u18D3\u18D5\u6551;\u656C;\u6563;\u6560;\u656B;\u6562;\u655Fox;\u69C9\u0200LRlr\u18E4\u18E6\u18E8\u18EA;\u6555;\u6552;\u6510;\u650C\u0280;DUdu\u06BD\u18F7\u18F9\u18FB\u18FD;\u6565;\u6568;\u652C;\u6534inus;\u629Flus;\u629Eimes;\u62A0\u0200LRlr\u1919\u191B\u191D\u191F;\u655B;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193B\u6502;\u656A;\u6561;\u655E;\u653C;\u6524;\u651C\u0100ev\u0123\u1942bar\u803B\xA6\u40A6\u0200ceio\u1951\u1956\u195A\u1960r;\uC000\u{1D4B7}mi;\u604Fm\u0100;e\u171A\u171Cl\u0180;bh\u1968\u1969\u196B\u405C;\u69C5sub;\u67C8\u016C\u1974\u197El\u0100;e\u1979\u197A\u6022t\xBB\u197Ap\u0180;Ee\u012F\u1985\u1987;\u6AAE\u0100;q\u06DC\u06DB\u0CE1\u19A7\0\u19E8\u1A11\u1A15\u1A32\0\u1A37\u1A50\0\0\u1AB4\0\0\u1AC1\0\0\u1B21\u1B2E\u1B4D\u1B52\0\u1BFD\0\u1C0C\u0180cpr\u19AD\u19B2\u19DDute;\u4107\u0300;abcds\u19BF\u19C0\u19C4\u19CA\u19D5\u19D9\u6229nd;\u6A44rcup;\u6A49\u0100au\u19CF\u19D2p;\u6A4Bp;\u6A47ot;\u6A40;\uC000\u2229\uFE00\u0100eo\u19E2\u19E5t;\u6041\xEE\u0693\u0200aeiu\u19F0\u19FB\u1A01\u1A05\u01F0\u19F5\0\u19F8s;\u6A4Don;\u410Ddil\u803B\xE7\u40E7rc;\u4109ps\u0100;s\u1A0C\u1A0D\u6A4Cm;\u6A50ot;\u410B\u0180dmn\u1A1B\u1A20\u1A26il\u80BB\xB8\u01ADptyv;\u69B2t\u8100\xA2;e\u1A2D\u1A2E\u40A2r\xE4\u01B2r;\uC000\u{1D520}\u0180cei\u1A3D\u1A40\u1A4Dy;\u4447ck\u0100;m\u1A47\u1A48\u6713ark\xBB\u1A48;\u43C7r\u0380;Ecefms\u1A5F\u1A60\u1A62\u1A6B\u1AA4\u1AAA\u1AAE\u65CB;\u69C3\u0180;el\u1A69\u1A6A\u1A6D\u42C6q;\u6257e\u0261\u1A74\0\0\u1A88rrow\u0100lr\u1A7C\u1A81eft;\u61BAight;\u61BB\u0280RSacd\u1A92\u1A94\u1A96\u1A9A\u1A9F\xBB\u0F47;\u64C8st;\u629Birc;\u629Aash;\u629Dnint;\u6A10id;\u6AEFcir;\u69C2ubs\u0100;u\u1ABB\u1ABC\u6663it\xBB\u1ABC\u02EC\u1AC7\u1AD4\u1AFA\0\u1B0Aon\u0100;e\u1ACD\u1ACE\u403A\u0100;q\xC7\xC6\u026D\u1AD9\0\0\u1AE2a\u0100;t\u1ADE\u1ADF\u402C;\u4040\u0180;fl\u1AE8\u1AE9\u1AEB\u6201\xEE\u1160e\u0100mx\u1AF1\u1AF6ent\xBB\u1AE9e\xF3\u024D\u01E7\u1AFE\0\u1B07\u0100;d\u12BB\u1B02ot;\u6A6Dn\xF4\u0246\u0180fry\u1B10\u1B14\u1B17;\uC000\u{1D554}o\xE4\u0254\u8100\xA9;s\u0155\u1B1Dr;\u6117\u0100ao\u1B25\u1B29rr;\u61B5ss;\u6717\u0100cu\u1B32\u1B37r;\uC000\u{1D4B8}\u0100bp\u1B3C\u1B44\u0100;e\u1B41\u1B42\u6ACF;\u6AD1\u0100;e\u1B49\u1B4A\u6AD0;\u6AD2dot;\u62EF\u0380delprvw\u1B60\u1B6C\u1B77\u1B82\u1BAC\u1BD4\u1BF9arr\u0100lr\u1B68\u1B6A;\u6938;\u6935\u0270\u1B72\0\0\u1B75r;\u62DEc;\u62DFarr\u0100;p\u1B7F\u1B80\u61B6;\u693D\u0300;bcdos\u1B8F\u1B90\u1B96\u1BA1\u1BA5\u1BA8\u622Arcap;\u6A48\u0100au\u1B9B\u1B9Ep;\u6A46p;\u6A4Aot;\u628Dr;\u6A45;\uC000\u222A\uFE00\u0200alrv\u1BB5\u1BBF\u1BDE\u1BE3rr\u0100;m\u1BBC\u1BBD\u61B7;\u693Cy\u0180evw\u1BC7\u1BD4\u1BD8q\u0270\u1BCE\0\0\u1BD2re\xE3\u1B73u\xE3\u1B75ee;\u62CEedge;\u62CFen\u803B\xA4\u40A4earrow\u0100lr\u1BEE\u1BF3eft\xBB\u1B80ight\xBB\u1BBDe\xE4\u1BDD\u0100ci\u1C01\u1C07onin\xF4\u01F7nt;\u6231lcty;\u632D\u0980AHabcdefhijlorstuwz\u1C38\u1C3B\u1C3F\u1C5D\u1C69\u1C75\u1C8A\u1C9E\u1CAC\u1CB7\u1CFB\u1CFF\u1D0D\u1D7B\u1D91\u1DAB\u1DBB\u1DC6\u1DCDr\xF2\u0381ar;\u6965\u0200glrs\u1C48\u1C4D\u1C52\u1C54ger;\u6020eth;\u6138\xF2\u1133h\u0100;v\u1C5A\u1C5B\u6010\xBB\u090A\u016B\u1C61\u1C67arow;\u690Fa\xE3\u0315\u0100ay\u1C6E\u1C73ron;\u410F;\u4434\u0180;ao\u0332\u1C7C\u1C84\u0100gr\u02BF\u1C81r;\u61CAtseq;\u6A77\u0180glm\u1C91\u1C94\u1C98\u803B\xB0\u40B0ta;\u43B4ptyv;\u69B1\u0100ir\u1CA3\u1CA8sht;\u697F;\uC000\u{1D521}ar\u0100lr\u1CB3\u1CB5\xBB\u08DC\xBB\u101E\u0280aegsv\u1CC2\u0378\u1CD6\u1CDC\u1CE0m\u0180;os\u0326\u1CCA\u1CD4nd\u0100;s\u0326\u1CD1uit;\u6666amma;\u43DDin;\u62F2\u0180;io\u1CE7\u1CE8\u1CF8\u40F7de\u8100\xF7;o\u1CE7\u1CF0ntimes;\u62C7n\xF8\u1CF7cy;\u4452c\u026F\u1D06\0\0\u1D0Arn;\u631Eop;\u630D\u0280lptuw\u1D18\u1D1D\u1D22\u1D49\u1D55lar;\u4024f;\uC000\u{1D555}\u0280;emps\u030B\u1D2D\u1D37\u1D3D\u1D42q\u0100;d\u0352\u1D33ot;\u6251inus;\u6238lus;\u6214quare;\u62A1blebarwedg\xE5\xFAn\u0180adh\u112E\u1D5D\u1D67ownarrow\xF3\u1C83arpoon\u0100lr\u1D72\u1D76ef\xF4\u1CB4igh\xF4\u1CB6\u0162\u1D7F\u1D85karo\xF7\u0F42\u026F\u1D8A\0\0\u1D8Ern;\u631Fop;\u630C\u0180cot\u1D98\u1DA3\u1DA6\u0100ry\u1D9D\u1DA1;\uC000\u{1D4B9};\u4455l;\u69F6rok;\u4111\u0100dr\u1DB0\u1DB4ot;\u62F1i\u0100;f\u1DBA\u1816\u65BF\u0100ah\u1DC0\u1DC3r\xF2\u0429a\xF2\u0FA6angle;\u69A6\u0100ci\u1DD2\u1DD5y;\u445Fgrarr;\u67FF\u0900Dacdefglmnopqrstux\u1E01\u1E09\u1E19\u1E38\u0578\u1E3C\u1E49\u1E61\u1E7E\u1EA5\u1EAF\u1EBD\u1EE1\u1F2A\u1F37\u1F44\u1F4E\u1F5A\u0100Do\u1E06\u1D34o\xF4\u1C89\u0100cs\u1E0E\u1E14ute\u803B\xE9\u40E9ter;\u6A6E\u0200aioy\u1E22\u1E27\u1E31\u1E36ron;\u411Br\u0100;c\u1E2D\u1E2E\u6256\u803B\xEA\u40EAlon;\u6255;\u444Dot;\u4117\u0100Dr\u1E41\u1E45ot;\u6252;\uC000\u{1D522}\u0180;rs\u1E50\u1E51\u1E57\u6A9Aave\u803B\xE8\u40E8\u0100;d\u1E5C\u1E5D\u6A96ot;\u6A98\u0200;ils\u1E6A\u1E6B\u1E72\u1E74\u6A99nters;\u63E7;\u6113\u0100;d\u1E79\u1E7A\u6A95ot;\u6A97\u0180aps\u1E85\u1E89\u1E97cr;\u4113ty\u0180;sv\u1E92\u1E93\u1E95\u6205et\xBB\u1E93p\u01001;\u1E9D\u1EA4\u0133\u1EA1\u1EA3;\u6004;\u6005\u6003\u0100gs\u1EAA\u1EAC;\u414Bp;\u6002\u0100gp\u1EB4\u1EB8on;\u4119f;\uC000\u{1D556}\u0180als\u1EC4\u1ECE\u1ED2r\u0100;s\u1ECA\u1ECB\u62D5l;\u69E3us;\u6A71i\u0180;lv\u1EDA\u1EDB\u1EDF\u43B5on\xBB\u1EDB;\u43F5\u0200csuv\u1EEA\u1EF3\u1F0B\u1F23\u0100io\u1EEF\u1E31rc\xBB\u1E2E\u0269\u1EF9\0\0\u1EFB\xED\u0548ant\u0100gl\u1F02\u1F06tr\xBB\u1E5Dess\xBB\u1E7A\u0180aei\u1F12\u1F16\u1F1Als;\u403Dst;\u625Fv\u0100;D\u0235\u1F20D;\u6A78parsl;\u69E5\u0100Da\u1F2F\u1F33ot;\u6253rr;\u6971\u0180cdi\u1F3E\u1F41\u1EF8r;\u612Fo\xF4\u0352\u0100ah\u1F49\u1F4B;\u43B7\u803B\xF0\u40F0\u0100mr\u1F53\u1F57l\u803B\xEB\u40EBo;\u60AC\u0180cip\u1F61\u1F64\u1F67l;\u4021s\xF4\u056E\u0100eo\u1F6C\u1F74ctatio\xEE\u0559nential\xE5\u0579\u09E1\u1F92\0\u1F9E\0\u1FA1\u1FA7\0\0\u1FC6\u1FCC\0\u1FD3\0\u1FE6\u1FEA\u2000\0\u2008\u205Allingdotse\xF1\u1E44y;\u4444male;\u6640\u0180ilr\u1FAD\u1FB3\u1FC1lig;\u8000\uFB03\u0269\u1FB9\0\0\u1FBDg;\u8000\uFB00ig;\u8000\uFB04;\uC000\u{1D523}lig;\u8000\uFB01lig;\uC000fj\u0180alt\u1FD9\u1FDC\u1FE1t;\u666Dig;\u8000\uFB02ns;\u65B1of;\u4192\u01F0\u1FEE\0\u1FF3f;\uC000\u{1D557}\u0100ak\u05BF\u1FF7\u0100;v\u1FFC\u1FFD\u62D4;\u6AD9artint;\u6A0D\u0100ao\u200C\u2055\u0100cs\u2011\u2052\u03B1\u201A\u2030\u2038\u2045\u2048\0\u2050\u03B2\u2022\u2025\u2027\u202A\u202C\0\u202E\u803B\xBD\u40BD;\u6153\u803B\xBC\u40BC;\u6155;\u6159;\u615B\u01B3\u2034\0\u2036;\u6154;\u6156\u02B4\u203E\u2041\0\0\u2043\u803B\xBE\u40BE;\u6157;\u615C5;\u6158\u01B6\u204C\0\u204E;\u615A;\u615D8;\u615El;\u6044wn;\u6322cr;\uC000\u{1D4BB}\u0880Eabcdefgijlnorstv\u2082\u2089\u209F\u20A5\u20B0\u20B4\u20F0\u20F5\u20FA\u20FF\u2103\u2112\u2138\u0317\u213E\u2152\u219E\u0100;l\u064D\u2087;\u6A8C\u0180cmp\u2090\u2095\u209Dute;\u41F5ma\u0100;d\u209C\u1CDA\u43B3;\u6A86reve;\u411F\u0100iy\u20AA\u20AErc;\u411D;\u4433ot;\u4121\u0200;lqs\u063E\u0642\u20BD\u20C9\u0180;qs\u063E\u064C\u20C4lan\xF4\u0665\u0200;cdl\u0665\u20D2\u20D5\u20E5c;\u6AA9ot\u0100;o\u20DC\u20DD\u6A80\u0100;l\u20E2\u20E3\u6A82;\u6A84\u0100;e\u20EA\u20ED\uC000\u22DB\uFE00s;\u6A94r;\uC000\u{1D524}\u0100;g\u0673\u061Bmel;\u6137cy;\u4453\u0200;Eaj\u065A\u210C\u210E\u2110;\u6A92;\u6AA5;\u6AA4\u0200Eaes\u211B\u211D\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6A8Arox\xBB\u2124\u0100;q\u212E\u212F\u6A88\u0100;q\u212E\u211Bim;\u62E7pf;\uC000\u{1D558}\u0100ci\u2143\u2146r;\u610Am\u0180;el\u066B\u214E\u2150;\u6A8E;\u6A90\u8300>;cdlqr\u05EE\u2160\u216A\u216E\u2173\u2179\u0100ci\u2165\u2167;\u6AA7r;\u6A7Aot;\u62D7Par;\u6995uest;\u6A7C\u0280adels\u2184\u216A\u2190\u0656\u219B\u01F0\u2189\0\u218Epro\xF8\u209Er;\u6978q\u0100lq\u063F\u2196les\xF3\u2088i\xED\u066B\u0100en\u21A3\u21ADrtneqq;\uC000\u2269\uFE00\xC5\u21AA\u0500Aabcefkosy\u21C4\u21C7\u21F1\u21F5\u21FA\u2218\u221D\u222F\u2268\u227Dr\xF2\u03A0\u0200ilmr\u21D0\u21D4\u21D7\u21DBrs\xF0\u1484f\xBB\u2024il\xF4\u06A9\u0100dr\u21E0\u21E4cy;\u444A\u0180;cw\u08F4\u21EB\u21EFir;\u6948;\u61ADar;\u610Firc;\u4125\u0180alr\u2201\u220E\u2213rts\u0100;u\u2209\u220A\u6665it\xBB\u220Alip;\u6026con;\u62B9r;\uC000\u{1D525}s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223A\u223E\u2243\u225E\u2263rr;\u61FFtht;\u623Bk\u0100lr\u2249\u2253eftarrow;\u61A9ightarrow;\u61AAf;\uC000\u{1D559}bar;\u6015\u0180clt\u226F\u2274\u2278r;\uC000\u{1D4BD}as\xE8\u21F4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xBB\u1C5B\u0AE1\u22A3\0\u22AA\0\u22B8\u22C5\u22CE\0\u22D5\u22F3\0\0\u22F8\u2322\u2367\u2362\u237F\0\u2386\u23AA\u23B4cute\u803B\xED\u40ED\u0180;iy\u0771\u22B0\u22B5rc\u803B\xEE\u40EE;\u4438\u0100cx\u22BC\u22BFy;\u4435cl\u803B\xA1\u40A1\u0100fr\u039F\u22C9;\uC000\u{1D526}rave\u803B\xEC\u40EC\u0200;ino\u073E\u22DD\u22E9\u22EE\u0100in\u22E2\u22E6nt;\u6A0Ct;\u622Dfin;\u69DCta;\u6129lig;\u4133\u0180aop\u22FE\u231A\u231D\u0180cgt\u2305\u2308\u2317r;\u412B\u0180elp\u071F\u230F\u2313in\xE5\u078Ear\xF4\u0720h;\u4131f;\u62B7ed;\u41B5\u0280;cfot\u04F4\u232C\u2331\u233D\u2341are;\u6105in\u0100;t\u2338\u2339\u621Eie;\u69DDdo\xF4\u2319\u0280;celp\u0757\u234C\u2350\u235B\u2361al;\u62BA\u0100gr\u2355\u2359er\xF3\u1563\xE3\u234Darhk;\u6A17rod;\u6A3C\u0200cgpt\u236F\u2372\u2376\u237By;\u4451on;\u412Ff;\uC000\u{1D55A}a;\u43B9uest\u803B\xBF\u40BF\u0100ci\u238A\u238Fr;\uC000\u{1D4BE}n\u0280;Edsv\u04F4\u239B\u239D\u23A1\u04F3;\u62F9ot;\u62F5\u0100;v\u23A6\u23A7\u62F4;\u62F3\u0100;i\u0777\u23AElde;\u4129\u01EB\u23B8\0\u23BCcy;\u4456l\u803B\xEF\u40EF\u0300cfmosu\u23CC\u23D7\u23DC\u23E1\u23E7\u23F5\u0100iy\u23D1\u23D5rc;\u4135;\u4439r;\uC000\u{1D527}ath;\u4237pf;\uC000\u{1D55B}\u01E3\u23EC\0\u23F1r;\uC000\u{1D4BF}rcy;\u4458kcy;\u4454\u0400acfghjos\u240B\u2416\u2422\u2427\u242D\u2431\u2435\u243Bppa\u0100;v\u2413\u2414\u43BA;\u43F0\u0100ey\u241B\u2420dil;\u4137;\u443Ar;\uC000\u{1D528}reen;\u4138cy;\u4445cy;\u445Cpf;\uC000\u{1D55C}cr;\uC000\u{1D4C0}\u0B80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248D\u2491\u250E\u253D\u255A\u2580\u264E\u265E\u2665\u2679\u267D\u269A\u26B2\u26D8\u275D\u2768\u278B\u27C0\u2801\u2812\u0180art\u2477\u247A\u247Cr\xF2\u09C6\xF2\u0395ail;\u691Barr;\u690E\u0100;g\u0994\u248B;\u6A8Bar;\u6962\u0963\u24A5\0\u24AA\0\u24B1\0\0\0\0\0\u24B5\u24BA\0\u24C6\u24C8\u24CD\0\u24F9ute;\u413Amptyv;\u69B4ra\xEE\u084Cbda;\u43BBg\u0180;dl\u088E\u24C1\u24C3;\u6991\xE5\u088E;\u6A85uo\u803B\xAB\u40ABr\u0400;bfhlpst\u0899\u24DE\u24E6\u24E9\u24EB\u24EE\u24F1\u24F5\u0100;f\u089D\u24E3s;\u691Fs;\u691D\xEB\u2252p;\u61ABl;\u6939im;\u6973l;\u61A2\u0180;ae\u24FF\u2500\u2504\u6AABil;\u6919\u0100;s\u2509\u250A\u6AAD;\uC000\u2AAD\uFE00\u0180abr\u2515\u2519\u251Drr;\u690Crk;\u6772\u0100ak\u2522\u252Cc\u0100ek\u2528\u252A;\u407B;\u405B\u0100es\u2531\u2533;\u698Bl\u0100du\u2539\u253B;\u698F;\u698D\u0200aeuy\u2546\u254B\u2556\u2558ron;\u413E\u0100di\u2550\u2554il;\u413C\xEC\u08B0\xE2\u2529;\u443B\u0200cqrs\u2563\u2566\u256D\u257Da;\u6936uo\u0100;r\u0E19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694Bh;\u61B2\u0280;fgqs\u258B\u258C\u0989\u25F3\u25FF\u6264t\u0280ahlrt\u2598\u25A4\u25B7\u25C2\u25E8rrow\u0100;t\u0899\u25A1a\xE9\u24F6arpoon\u0100du\u25AF\u25B4own\xBB\u045Ap\xBB\u0966eftarrows;\u61C7ight\u0180ahs\u25CD\u25D6\u25DErrow\u0100;s\u08F4\u08A7arpoon\xF3\u0F98quigarro\xF7\u21F0hreetimes;\u62CB\u0180;qs\u258B\u0993\u25FAlan\xF4\u09AC\u0280;cdgs\u09AC\u260A\u260D\u261D\u2628c;\u6AA8ot\u0100;o\u2614\u2615\u6A7F\u0100;r\u261A\u261B\u6A81;\u6A83\u0100;e\u2622\u2625\uC000\u22DA\uFE00s;\u6A93\u0280adegs\u2633\u2639\u263D\u2649\u264Bppro\xF8\u24C6ot;\u62D6q\u0100gq\u2643\u2645\xF4\u0989gt\xF2\u248C\xF4\u099Bi\xED\u09B2\u0180ilr\u2655\u08E1\u265Asht;\u697C;\uC000\u{1D529}\u0100;E\u099C\u2663;\u6A91\u0161\u2669\u2676r\u0100du\u25B2\u266E\u0100;l\u0965\u2673;\u696Alk;\u6584cy;\u4459\u0280;acht\u0A48\u2688\u268B\u2691\u2696r\xF2\u25C1orne\xF2\u1D08ard;\u696Bri;\u65FA\u0100io\u269F\u26A4dot;\u4140ust\u0100;a\u26AC\u26AD\u63B0che\xBB\u26AD\u0200Eaes\u26BB\u26BD\u26C9\u26D4;\u6268p\u0100;p\u26C3\u26C4\u6A89rox\xBB\u26C4\u0100;q\u26CE\u26CF\u6A87\u0100;q\u26CE\u26BBim;\u62E6\u0400abnoptwz\u26E9\u26F4\u26F7\u271A\u272F\u2741\u2747\u2750\u0100nr\u26EE\u26F1g;\u67ECr;\u61FDr\xEB\u08C1g\u0180lmr\u26FF\u270D\u2714eft\u0100ar\u09E6\u2707ight\xE1\u09F2apsto;\u67FCight\xE1\u09FDparrow\u0100lr\u2725\u2729ef\xF4\u24EDight;\u61AC\u0180afl\u2736\u2739\u273Dr;\u6985;\uC000\u{1D55D}us;\u6A2Dimes;\u6A34\u0161\u274B\u274Fst;\u6217\xE1\u134E\u0180;ef\u2757\u2758\u1800\u65CAnge\xBB\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277C\u2785\u2787r\xF2\u08A8orne\xF2\u1D8Car\u0100;d\u0F98\u2783;\u696D;\u600Eri;\u62BF\u0300achiqt\u2798\u279D\u0A40\u27A2\u27AE\u27BBquo;\u6039r;\uC000\u{1D4C1}m\u0180;eg\u09B2\u27AA\u27AC;\u6A8D;\u6A8F\u0100bu\u252A\u27B3o\u0100;r\u0E1F\u27B9;\u601Arok;\u4142\u8400<;cdhilqr\u082B\u27D2\u2639\u27DC\u27E0\u27E5\u27EA\u27F0\u0100ci\u27D7\u27D9;\u6AA6r;\u6A79re\xE5\u25F2mes;\u62C9arr;\u6976uest;\u6A7B\u0100Pi\u27F5\u27F9ar;\u6996\u0180;ef\u2800\u092D\u181B\u65C3r\u0100du\u2807\u280Dshar;\u694Ahar;\u6966\u0100en\u2817\u2821rtneqq;\uC000\u2268\uFE00\xC5\u281E\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288E\u2893\u28A0\u28A5\u28A8\u28DA\u28E2\u28E4\u0A83\u28F3\u2902Dot;\u623A\u0200clpr\u284E\u2852\u2863\u287Dr\u803B\xAF\u40AF\u0100et\u2857\u2859;\u6642\u0100;e\u285E\u285F\u6720se\xBB\u285F\u0100;s\u103B\u2868to\u0200;dlu\u103B\u2873\u2877\u287Bow\xEE\u048Cef\xF4\u090F\xF0\u13D1ker;\u65AE\u0100oy\u2887\u288Cmma;\u6A29;\u443Cash;\u6014asuredangle\xBB\u1626r;\uC000\u{1D52A}o;\u6127\u0180cdn\u28AF\u28B4\u28C9ro\u803B\xB5\u40B5\u0200;acd\u1464\u28BD\u28C0\u28C4s\xF4\u16A7ir;\u6AF0ot\u80BB\xB7\u01B5us\u0180;bd\u28D2\u1903\u28D3\u6212\u0100;u\u1D3C\u28D8;\u6A2A\u0163\u28DE\u28E1p;\u6ADB\xF2\u2212\xF0\u0A81\u0100dp\u28E9\u28EEels;\u62A7f;\uC000\u{1D55E}\u0100ct\u28F8\u28FDr;\uC000\u{1D4C2}pos\xBB\u159D\u0180;lm\u2909\u290A\u290D\u43BCtimap;\u62B8\u0C00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297E\u2989\u2998\u29DA\u29E9\u2A15\u2A1A\u2A58\u2A5D\u2A83\u2A95\u2AA4\u2AA8\u2B04\u2B07\u2B44\u2B7F\u2BAE\u2C34\u2C67\u2C7C\u2CE9\u0100gt\u2947\u294B;\uC000\u22D9\u0338\u0100;v\u2950\u0BCF\uC000\u226B\u20D2\u0180elt\u295A\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61CDightarrow;\u61CE;\uC000\u22D8\u0338\u0100;v\u297B\u0C47\uC000\u226A\u20D2ightarrow;\u61CF\u0100Dd\u298E\u2993ash;\u62AFash;\u62AE\u0280bcnpt\u29A3\u29A7\u29AC\u29B1\u29CCla\xBB\u02DEute;\u4144g;\uC000\u2220\u20D2\u0280;Eiop\u0D84\u29BC\u29C0\u29C5\u29C8;\uC000\u2A70\u0338d;\uC000\u224B\u0338s;\u4149ro\xF8\u0D84ur\u0100;a\u29D3\u29D4\u666El\u0100;s\u29D3\u0B38\u01F3\u29DF\0\u29E3p\u80BB\xA0\u0B37mp\u0100;e\u0BF9\u0C00\u0280aeouy\u29F4\u29FE\u2A03\u2A10\u2A13\u01F0\u29F9\0\u29FB;\u6A43on;\u4148dil;\u4146ng\u0100;d\u0D7E\u2A0Aot;\uC000\u2A6D\u0338p;\u6A42;\u443Dash;\u6013\u0380;Aadqsx\u0B92\u2A29\u2A2D\u2A3B\u2A41\u2A45\u2A50rr;\u61D7r\u0100hr\u2A33\u2A36k;\u6924\u0100;o\u13F2\u13F0ot;\uC000\u2250\u0338ui\xF6\u0B63\u0100ei\u2A4A\u2A4Ear;\u6928\xED\u0B98ist\u0100;s\u0BA0\u0B9Fr;\uC000\u{1D52B}\u0200Eest\u0BC5\u2A66\u2A79\u2A7C\u0180;qs\u0BBC\u2A6D\u0BE1\u0180;qs\u0BBC\u0BC5\u2A74lan\xF4\u0BE2i\xED\u0BEA\u0100;r\u0BB6\u2A81\xBB\u0BB7\u0180Aap\u2A8A\u2A8D\u2A91r\xF2\u2971rr;\u61AEar;\u6AF2\u0180;sv\u0F8D\u2A9C\u0F8C\u0100;d\u2AA1\u2AA2\u62FC;\u62FAcy;\u445A\u0380AEadest\u2AB7\u2ABA\u2ABE\u2AC2\u2AC5\u2AF6\u2AF9r\xF2\u2966;\uC000\u2266\u0338rr;\u619Ar;\u6025\u0200;fqs\u0C3B\u2ACE\u2AE3\u2AEFt\u0100ar\u2AD4\u2AD9rro\xF7\u2AC1ightarro\xF7\u2A90\u0180;qs\u0C3B\u2ABA\u2AEAlan\xF4\u0C55\u0100;s\u0C55\u2AF4\xBB\u0C36i\xED\u0C5D\u0100;r\u0C35\u2AFEi\u0100;e\u0C1A\u0C25i\xE4\u0D90\u0100pt\u2B0C\u2B11f;\uC000\u{1D55F}\u8180\xAC;in\u2B19\u2B1A\u2B36\u40ACn\u0200;Edv\u0B89\u2B24\u2B28\u2B2E;\uC000\u22F9\u0338ot;\uC000\u22F5\u0338\u01E1\u0B89\u2B33\u2B35;\u62F7;\u62F6i\u0100;v\u0CB8\u2B3C\u01E1\u0CB8\u2B41\u2B43;\u62FE;\u62FD\u0180aor\u2B4B\u2B63\u2B69r\u0200;ast\u0B7B\u2B55\u2B5A\u2B5Flle\xEC\u0B7Bl;\uC000\u2AFD\u20E5;\uC000\u2202\u0338lint;\u6A14\u0180;ce\u0C92\u2B70\u2B73u\xE5\u0CA5\u0100;c\u0C98\u2B78\u0100;e\u0C92\u2B7D\xF1\u0C98\u0200Aait\u2B88\u2B8B\u2B9D\u2BA7r\xF2\u2988rr\u0180;cw\u2B94\u2B95\u2B99\u619B;\uC000\u2933\u0338;\uC000\u219D\u0338ghtarrow\xBB\u2B95ri\u0100;e\u0CCB\u0CD6\u0380chimpqu\u2BBD\u2BCD\u2BD9\u2B04\u0B78\u2BE4\u2BEF\u0200;cer\u0D32\u2BC6\u0D37\u2BC9u\xE5\u0D45;\uC000\u{1D4C3}ort\u026D\u2B05\0\0\u2BD6ar\xE1\u2B56m\u0100;e\u0D6E\u2BDF\u0100;q\u0D74\u0D73su\u0100bp\u2BEB\u2BED\xE5\u0CF8\xE5\u0D0B\u0180bcp\u2BF6\u2C11\u2C19\u0200;Ees\u2BFF\u2C00\u0D22\u2C04\u6284;\uC000\u2AC5\u0338et\u0100;e\u0D1B\u2C0Bq\u0100;q\u0D23\u2C00c\u0100;e\u0D32\u2C17\xF1\u0D38\u0200;Ees\u2C22\u2C23\u0D5F\u2C27\u6285;\uC000\u2AC6\u0338et\u0100;e\u0D58\u2C2Eq\u0100;q\u0D60\u2C23\u0200gilr\u2C3D\u2C3F\u2C45\u2C47\xEC\u0BD7lde\u803B\xF1\u40F1\xE7\u0C43iangle\u0100lr\u2C52\u2C5Ceft\u0100;e\u0C1A\u2C5A\xF1\u0C26ight\u0100;e\u0CCB\u2C65\xF1\u0CD7\u0100;m\u2C6C\u2C6D\u43BD\u0180;es\u2C74\u2C75\u2C79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2C8F\u2C94\u2C99\u2C9E\u2CA3\u2CB0\u2CB6\u2CD3\u2CE3ash;\u62ADarr;\u6904p;\uC000\u224D\u20D2ash;\u62AC\u0100et\u2CA8\u2CAC;\uC000\u2265\u20D2;\uC000>\u20D2nfin;\u69DE\u0180Aet\u2CBD\u2CC1\u2CC5rr;\u6902;\uC000\u2264\u20D2\u0100;r\u2CCA\u2CCD\uC000<\u20D2ie;\uC000\u22B4\u20D2\u0100At\u2CD8\u2CDCrr;\u6903rie;\uC000\u22B5\u20D2im;\uC000\u223C\u20D2\u0180Aan\u2CF0\u2CF4\u2D02rr;\u61D6r\u0100hr\u2CFA\u2CFDk;\u6923\u0100;o\u13E7\u13E5ear;\u6927\u1253\u1A95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2D2D\0\u2D38\u2D48\u2D60\u2D65\u2D72\u2D84\u1B07\0\0\u2D8D\u2DAB\0\u2DC8\u2DCE\0\u2DDC\u2E19\u2E2B\u2E3E\u2E43\u0100cs\u2D31\u1A97ute\u803B\xF3\u40F3\u0100iy\u2D3C\u2D45r\u0100;c\u1A9E\u2D42\u803B\xF4\u40F4;\u443E\u0280abios\u1AA0\u2D52\u2D57\u01C8\u2D5Alac;\u4151v;\u6A38old;\u69BClig;\u4153\u0100cr\u2D69\u2D6Dir;\u69BF;\uC000\u{1D52C}\u036F\u2D79\0\0\u2D7C\0\u2D82n;\u42DBave\u803B\xF2\u40F2;\u69C1\u0100bm\u2D88\u0DF4ar;\u69B5\u0200acit\u2D95\u2D98\u2DA5\u2DA8r\xF2\u1A80\u0100ir\u2D9D\u2DA0r;\u69BEoss;\u69BBn\xE5\u0E52;\u69C0\u0180aei\u2DB1\u2DB5\u2DB9cr;\u414Dga;\u43C9\u0180cdn\u2DC0\u2DC5\u01CDron;\u43BF;\u69B6pf;\uC000\u{1D560}\u0180ael\u2DD4\u2DD7\u01D2r;\u69B7rp;\u69B9\u0380;adiosv\u2DEA\u2DEB\u2DEE\u2E08\u2E0D\u2E10\u2E16\u6228r\xF2\u1A86\u0200;efm\u2DF7\u2DF8\u2E02\u2E05\u6A5Dr\u0100;o\u2DFE\u2DFF\u6134f\xBB\u2DFF\u803B\xAA\u40AA\u803B\xBA\u40BAgof;\u62B6r;\u6A56lope;\u6A57;\u6A5B\u0180clo\u2E1F\u2E21\u2E27\xF2\u2E01ash\u803B\xF8\u40F8l;\u6298i\u016C\u2E2F\u2E34de\u803B\xF5\u40F5es\u0100;a\u01DB\u2E3As;\u6A36ml\u803B\xF6\u40F6bar;\u633D\u0AE1\u2E5E\0\u2E7D\0\u2E80\u2E9D\0\u2EA2\u2EB9\0\0\u2ECB\u0E9C\0\u2F13\0\0\u2F2B\u2FBC\0\u2FC8r\u0200;ast\u0403\u2E67\u2E72\u0E85\u8100\xB6;l\u2E6D\u2E6E\u40B6le\xEC\u0403\u0269\u2E78\0\0\u2E7Bm;\u6AF3;\u6AFDy;\u443Fr\u0280cimpt\u2E8B\u2E8F\u2E93\u1865\u2E97nt;\u4025od;\u402Eil;\u6030enk;\u6031r;\uC000\u{1D52D}\u0180imo\u2EA8\u2EB0\u2EB4\u0100;v\u2EAD\u2EAE\u43C6;\u43D5ma\xF4\u0A76ne;\u660E\u0180;tv\u2EBF\u2EC0\u2EC8\u43C0chfork\xBB\u1FFD;\u43D6\u0100au\u2ECF\u2EDFn\u0100ck\u2ED5\u2EDDk\u0100;h\u21F4\u2EDB;\u610E\xF6\u21F4s\u0480;abcdemst\u2EF3\u2EF4\u1908\u2EF9\u2EFD\u2F04\u2F06\u2F0A\u2F0E\u402Bcir;\u6A23ir;\u6A22\u0100ou\u1D40\u2F02;\u6A25;\u6A72n\u80BB\xB1\u0E9Dim;\u6A26wo;\u6A27\u0180ipu\u2F19\u2F20\u2F25ntint;\u6A15f;\uC000\u{1D561}nd\u803B\xA3\u40A3\u0500;Eaceinosu\u0EC8\u2F3F\u2F41\u2F44\u2F47\u2F81\u2F89\u2F92\u2F7E\u2FB6;\u6AB3p;\u6AB7u\xE5\u0ED9\u0100;c\u0ECE\u2F4C\u0300;acens\u0EC8\u2F59\u2F5F\u2F66\u2F68\u2F7Eppro\xF8\u2F43urlye\xF1\u0ED9\xF1\u0ECE\u0180aes\u2F6F\u2F76\u2F7Approx;\u6AB9qq;\u6AB5im;\u62E8i\xED\u0EDFme\u0100;s\u2F88\u0EAE\u6032\u0180Eas\u2F78\u2F90\u2F7A\xF0\u2F75\u0180dfp\u0EEC\u2F99\u2FAF\u0180als\u2FA0\u2FA5\u2FAAlar;\u632Eine;\u6312urf;\u6313\u0100;t\u0EFB\u2FB4\xEF\u0EFBrel;\u62B0\u0100ci\u2FC0\u2FC5r;\uC000\u{1D4C5};\u43C8ncsp;\u6008\u0300fiopsu\u2FDA\u22E2\u2FDF\u2FE5\u2FEB\u2FF1r;\uC000\u{1D52E}pf;\uC000\u{1D562}rime;\u6057cr;\uC000\u{1D4C6}\u0180aeo\u2FF8\u3009\u3013t\u0100ei\u2FFE\u3005rnion\xF3\u06B0nt;\u6A16st\u0100;e\u3010\u3011\u403F\xF1\u1F19\xF4\u0F14\u0A80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30E0\u310E\u312B\u3147\u3162\u3172\u318E\u3206\u3215\u3224\u3229\u3258\u326E\u3272\u3290\u32B0\u32B7\u0180art\u3047\u304A\u304Cr\xF2\u10B3\xF2\u03DDail;\u691Car\xF2\u1C65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307F\u308F\u3094\u30CC\u0100eu\u306D\u3071;\uC000\u223D\u0331te;\u4155i\xE3\u116Emptyv;\u69B3g\u0200;del\u0FD1\u3089\u308B\u308D;\u6992;\u69A5\xE5\u0FD1uo\u803B\xBB\u40BBr\u0580;abcfhlpstw\u0FDC\u30AC\u30AF\u30B7\u30B9\u30BC\u30BE\u30C0\u30C3\u30C7\u30CAp;\u6975\u0100;f\u0FE0\u30B4s;\u6920;\u6933s;\u691E\xEB\u225D\xF0\u272El;\u6945im;\u6974l;\u61A3;\u619D\u0100ai\u30D1\u30D5il;\u691Ao\u0100;n\u30DB\u30DC\u6236al\xF3\u0F1E\u0180abr\u30E7\u30EA\u30EEr\xF2\u17E5rk;\u6773\u0100ak\u30F3\u30FDc\u0100ek\u30F9\u30FB;\u407D;\u405D\u0100es\u3102\u3104;\u698Cl\u0100du\u310A\u310C;\u698E;\u6990\u0200aeuy\u3117\u311C\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xEC\u0FF2\xE2\u30FA;\u4440\u0200clqs\u3134\u3137\u313D\u3144a;\u6937dhar;\u6969uo\u0100;r\u020E\u020Dh;\u61B3\u0180acg\u314E\u315F\u0F44l\u0200;ips\u0F78\u3158\u315B\u109Cn\xE5\u10BBar\xF4\u0FA9t;\u65AD\u0180ilr\u3169\u1023\u316Esht;\u697D;\uC000\u{1D52F}\u0100ao\u3177\u3186r\u0100du\u317D\u317F\xBB\u047B\u0100;l\u1091\u3184;\u696C\u0100;v\u318B\u318C\u43C1;\u43F1\u0180gns\u3195\u31F9\u31FCht\u0300ahlrst\u31A4\u31B0\u31C2\u31D8\u31E4\u31EErrow\u0100;t\u0FDC\u31ADa\xE9\u30C8arpoon\u0100du\u31BB\u31BFow\xEE\u317Ep\xBB\u1092eft\u0100ah\u31CA\u31D0rrow\xF3\u0FEAarpoon\xF3\u0551ightarrows;\u61C9quigarro\xF7\u30CBhreetimes;\u62CCg;\u42DAingdotse\xF1\u1F32\u0180ahm\u320D\u3210\u3213r\xF2\u0FEAa\xF2\u0551;\u600Foust\u0100;a\u321E\u321F\u63B1che\xBB\u321Fmid;\u6AEE\u0200abpt\u3232\u323D\u3240\u3252\u0100nr\u3237\u323Ag;\u67EDr;\u61FEr\xEB\u1003\u0180afl\u3247\u324A\u324Er;\u6986;\uC000\u{1D563}us;\u6A2Eimes;\u6A35\u0100ap\u325D\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6A12ar\xF2\u31E3\u0200achq\u327B\u3280\u10BC\u3285quo;\u603Ar;\uC000\u{1D4C7}\u0100bu\u30FB\u328Ao\u0100;r\u0214\u0213\u0180hir\u3297\u329B\u32A0re\xE5\u31F8mes;\u62CAi\u0200;efl\u32AA\u1059\u1821\u32AB\u65B9tri;\u69CEluhar;\u6968;\u611E\u0D61\u32D5\u32DB\u32DF\u332C\u3338\u3371\0\u337A\u33A4\0\0\u33EC\u33F0\0\u3428\u3448\u345A\u34AD\u34B1\u34CA\u34F1\0\u3616\0\0\u3633cute;\u415Bqu\xEF\u27BA\u0500;Eaceinpsy\u11ED\u32F3\u32F5\u32FF\u3302\u330B\u330F\u331F\u3326\u3329;\u6AB4\u01F0\u32FA\0\u32FC;\u6AB8on;\u4161u\xE5\u11FE\u0100;d\u11F3\u3307il;\u415Frc;\u415D\u0180Eas\u3316\u3318\u331B;\u6AB6p;\u6ABAim;\u62E9olint;\u6A13i\xED\u1204;\u4441ot\u0180;be\u3334\u1D47\u3335\u62C5;\u6A66\u0380Aacmstx\u3346\u334A\u3357\u335B\u335E\u3363\u336Drr;\u61D8r\u0100hr\u3350\u3352\xEB\u2228\u0100;o\u0A36\u0A34t\u803B\xA7\u40A7i;\u403Bwar;\u6929m\u0100in\u3369\xF0nu\xF3\xF1t;\u6736r\u0100;o\u3376\u2055\uC000\u{1D530}\u0200acoy\u3382\u3386\u3391\u33A0rp;\u666F\u0100hy\u338B\u338Fcy;\u4449;\u4448rt\u026D\u3399\0\0\u339Ci\xE4\u1464ara\xEC\u2E6F\u803B\xAD\u40AD\u0100gm\u33A8\u33B4ma\u0180;fv\u33B1\u33B2\u33B2\u43C3;\u43C2\u0400;deglnpr\u12AB\u33C5\u33C9\u33CE\u33D6\u33DE\u33E1\u33E6ot;\u6A6A\u0100;q\u12B1\u12B0\u0100;E\u33D3\u33D4\u6A9E;\u6AA0\u0100;E\u33DB\u33DC\u6A9D;\u6A9Fe;\u6246lus;\u6A24arr;\u6972ar\xF2\u113D\u0200aeit\u33F8\u3408\u340F\u3417\u0100ls\u33FD\u3404lsetm\xE9\u336Ahp;\u6A33parsl;\u69E4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341C\u341D\u6AAA\u0100;s\u3422\u3423\u6AAC;\uC000\u2AAC\uFE00\u0180flp\u342E\u3433\u3442tcy;\u444C\u0100;b\u3438\u3439\u402F\u0100;a\u343E\u343F\u69C4r;\u633Ff;\uC000\u{1D564}a\u0100dr\u344D\u0402es\u0100;u\u3454\u3455\u6660it\xBB\u3455\u0180csu\u3460\u3479\u349F\u0100au\u3465\u346Fp\u0100;s\u1188\u346B;\uC000\u2293\uFE00p\u0100;s\u11B4\u3475;\uC000\u2294\uFE00u\u0100bp\u347F\u348F\u0180;es\u1197\u119C\u3486et\u0100;e\u1197\u348D\xF1\u119D\u0180;es\u11A8\u11AD\u3496et\u0100;e\u11A8\u349D\xF1\u11AE\u0180;af\u117B\u34A6\u05B0r\u0165\u34AB\u05B1\xBB\u117Car\xF2\u1148\u0200cemt\u34B9\u34BE\u34C2\u34C5r;\uC000\u{1D4C8}tm\xEE\xF1i\xEC\u3415ar\xE6\u11BE\u0100ar\u34CE\u34D5r\u0100;f\u34D4\u17BF\u6606\u0100an\u34DA\u34EDight\u0100ep\u34E3\u34EApsilo\xEE\u1EE0h\xE9\u2EAFs\xBB\u2852\u0280bcmnp\u34FB\u355E\u1209\u358B\u358E\u0480;Edemnprs\u350E\u350F\u3511\u3515\u351E\u3523\u352C\u3531\u3536\u6282;\u6AC5ot;\u6ABD\u0100;d\u11DA\u351Aot;\u6AC3ult;\u6AC1\u0100Ee\u3528\u352A;\u6ACB;\u628Alus;\u6ABFarr;\u6979\u0180eiu\u353D\u3552\u3555t\u0180;en\u350E\u3545\u354Bq\u0100;q\u11DA\u350Feq\u0100;q\u352B\u3528m;\u6AC7\u0100bp\u355A\u355C;\u6AD5;\u6AD3c\u0300;acens\u11ED\u356C\u3572\u3579\u357B\u3326ppro\xF8\u32FAurlye\xF1\u11FE\xF1\u11F3\u0180aes\u3582\u3588\u331Bppro\xF8\u331Aq\xF1\u3317g;\u666A\u0680123;Edehlmnps\u35A9\u35AC\u35AF\u121C\u35B2\u35B4\u35C0\u35C9\u35D5\u35DA\u35DF\u35E8\u35ED\u803B\xB9\u40B9\u803B\xB2\u40B2\u803B\xB3\u40B3;\u6AC6\u0100os\u35B9\u35BCt;\u6ABEub;\u6AD8\u0100;d\u1222\u35C5ot;\u6AC4s\u0100ou\u35CF\u35D2l;\u67C9b;\u6AD7arr;\u697Bult;\u6AC2\u0100Ee\u35E4\u35E6;\u6ACC;\u628Blus;\u6AC0\u0180eiu\u35F4\u3609\u360Ct\u0180;en\u121C\u35FC\u3602q\u0100;q\u1222\u35B2eq\u0100;q\u35E7\u35E4m;\u6AC8\u0100bp\u3611\u3613;\u6AD4;\u6AD6\u0180Aan\u361C\u3620\u362Drr;\u61D9r\u0100hr\u3626\u3628\xEB\u222E\u0100;o\u0A2B\u0A29war;\u692Alig\u803B\xDF\u40DF\u0BE1\u3651\u365D\u3660\u12CE\u3673\u3679\0\u367E\u36C2\0\0\0\0\0\u36DB\u3703\0\u3709\u376C\0\0\0\u3787\u0272\u3656\0\0\u365Bget;\u6316;\u43C4r\xEB\u0E5F\u0180aey\u3666\u366B\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uC000\u{1D531}\u0200eiko\u3686\u369D\u36B5\u36BC\u01F2\u368B\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369B\u43B8ym;\u43D1\u0100cn\u36A2\u36B2k\u0100as\u36A8\u36AEppro\xF8\u12C1im\xBB\u12ACs\xF0\u129E\u0100as\u36BA\u36AE\xF0\u12C1rn\u803B\xFE\u40FE\u01EC\u031F\u36C6\u22E7es\u8180\xD7;bd\u36CF\u36D0\u36D8\u40D7\u0100;a\u190F\u36D5r;\u6A31;\u6A30\u0180eps\u36E1\u36E3\u3700\xE1\u2A4D\u0200;bcf\u0486\u36EC\u36F0\u36F4ot;\u6336ir;\u6AF1\u0100;o\u36F9\u36FC\uC000\u{1D565}rk;\u6ADA\xE1\u3362rime;\u6034\u0180aip\u370F\u3712\u3764d\xE5\u1248\u0380adempst\u3721\u374D\u3740\u3751\u3757\u375C\u375Fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65B5own\xBB\u1DBBeft\u0100;e\u2800\u373E\xF1\u092E;\u625Cight\u0100;e\u32AA\u374B\xF1\u105Aot;\u65ECinus;\u6A3Alus;\u6A39b;\u69CDime;\u6A3Bezium;\u63E2\u0180cht\u3772\u377D\u3781\u0100ry\u3777\u377B;\uC000\u{1D4C9};\u4446cy;\u445Brok;\u4167\u0100io\u378B\u378Ex\xF4\u1777head\u0100lr\u3797\u37A0eftarro\xF7\u084Fightarrow\xBB\u0F5D\u0900AHabcdfghlmoprstuw\u37D0\u37D3\u37D7\u37E4\u37F0\u37FC\u380E\u381C\u3823\u3834\u3851\u385D\u386B\u38A9\u38CC\u38D2\u38EA\u38F6r\xF2\u03EDar;\u6963\u0100cr\u37DC\u37E2ute\u803B\xFA\u40FA\xF2\u1150r\u01E3\u37EA\0\u37EDy;\u445Eve;\u416D\u0100iy\u37F5\u37FArc\u803B\xFB\u40FB;\u4443\u0180abh\u3803\u3806\u380Br\xF2\u13ADlac;\u4171a\xF2\u13C3\u0100ir\u3813\u3818sht;\u697E;\uC000\u{1D532}rave\u803B\xF9\u40F9\u0161\u3827\u3831r\u0100lr\u382C\u382E\xBB\u0957\xBB\u1083lk;\u6580\u0100ct\u3839\u384D\u026F\u383F\0\0\u384Arn\u0100;e\u3845\u3846\u631Cr\xBB\u3846op;\u630Fri;\u65F8\u0100al\u3856\u385Acr;\u416B\u80BB\xA8\u0349\u0100gp\u3862\u3866on;\u4173f;\uC000\u{1D566}\u0300adhlsu\u114B\u3878\u387D\u1372\u3891\u38A0own\xE1\u13B3arpoon\u0100lr\u3888\u388Cef\xF4\u382Digh\xF4\u382Fi\u0180;hl\u3899\u389A\u389C\u43C5\xBB\u13FAon\xBB\u389Aparrows;\u61C8\u0180cit\u38B0\u38C4\u38C8\u026F\u38B6\0\0\u38C1rn\u0100;e\u38BC\u38BD\u631Dr\xBB\u38BDop;\u630Eng;\u416Fri;\u65F9cr;\uC000\u{1D4CA}\u0180dir\u38D9\u38DD\u38E2ot;\u62F0lde;\u4169i\u0100;f\u3730\u38E8\xBB\u1813\u0100am\u38EF\u38F2r\xF2\u38A8l\u803B\xFC\u40FCangle;\u69A7\u0780ABDacdeflnoprsz\u391C\u391F\u3929\u392D\u39B5\u39B8\u39BD\u39DF\u39E4\u39E8\u39F3\u39F9\u39FD\u3A01\u3A20r\xF2\u03F7ar\u0100;v\u3926\u3927\u6AE8;\u6AE9as\xE8\u03E1\u0100nr\u3932\u3937grt;\u699C\u0380eknprst\u34E3\u3946\u394B\u3952\u395D\u3964\u3996app\xE1\u2415othin\xE7\u1E96\u0180hir\u34EB\u2EC8\u3959op\xF4\u2FB5\u0100;h\u13B7\u3962\xEF\u318D\u0100iu\u3969\u396Dgm\xE1\u33B3\u0100bp\u3972\u3984setneq\u0100;q\u397D\u3980\uC000\u228A\uFE00;\uC000\u2ACB\uFE00setneq\u0100;q\u398F\u3992\uC000\u228B\uFE00;\uC000\u2ACC\uFE00\u0100hr\u399B\u399Fet\xE1\u369Ciangle\u0100lr\u39AA\u39AFeft\xBB\u0925ight\xBB\u1051y;\u4432ash\xBB\u1036\u0180elr\u39C4\u39D2\u39D7\u0180;be\u2DEA\u39CB\u39CFar;\u62BBq;\u625Alip;\u62EE\u0100bt\u39DC\u1468a\xF2\u1469r;\uC000\u{1D533}tr\xE9\u39AEsu\u0100bp\u39EF\u39F1\xBB\u0D1C\xBB\u0D59pf;\uC000\u{1D567}ro\xF0\u0EFBtr\xE9\u39B4\u0100cu\u3A06\u3A0Br;\uC000\u{1D4CB}\u0100bp\u3A10\u3A18n\u0100Ee\u3980\u3A16\xBB\u397En\u0100Ee\u3992\u3A1E\xBB\u3990igzag;\u699A\u0380cefoprs\u3A36\u3A3B\u3A56\u3A5B\u3A54\u3A61\u3A6Airc;\u4175\u0100di\u3A40\u3A51\u0100bg\u3A45\u3A49ar;\u6A5Fe\u0100;q\u15FA\u3A4F;\u6259erp;\u6118r;\uC000\u{1D534}pf;\uC000\u{1D568}\u0100;e\u1479\u3A66at\xE8\u1479cr;\uC000\u{1D4CC}\u0AE3\u178E\u3A87\0\u3A8B\0\u3A90\u3A9B\0\0\u3A9D\u3AA8\u3AAB\u3AAF\0\0\u3AC3\u3ACE\0\u3AD8\u17DC\u17DFtr\xE9\u17D1r;\uC000\u{1D535}\u0100Aa\u3A94\u3A97r\xF2\u03C3r\xF2\u09F6;\u43BE\u0100Aa\u3AA1\u3AA4r\xF2\u03B8r\xF2\u09EBa\xF0\u2713is;\u62FB\u0180dpt\u17A4\u3AB5\u3ABE\u0100fl\u3ABA\u17A9;\uC000\u{1D569}im\xE5\u17B2\u0100Aa\u3AC7\u3ACAr\xF2\u03CEr\xF2\u0A01\u0100cq\u3AD2\u17B8r;\uC000\u{1D4CD}\u0100pt\u17D6\u3ADCr\xE9\u17D4\u0400acefiosu\u3AF0\u3AFD\u3B08\u3B0C\u3B11\u3B15\u3B1B\u3B21c\u0100uy\u3AF6\u3AFBte\u803B\xFD\u40FD;\u444F\u0100iy\u3B02\u3B06rc;\u4177;\u444Bn\u803B\xA5\u40A5r;\uC000\u{1D536}cy;\u4457pf;\uC000\u{1D56A}cr;\uC000\u{1D4CE}\u0100cm\u3B26\u3B29y;\u444El\u803B\xFF\u40FF\u0500acdefhiosw\u3B42\u3B48\u3B54\u3B58\u3B64\u3B69\u3B6D\u3B74\u3B7A\u3B80cute;\u417A\u0100ay\u3B4D\u3B52ron;\u417E;\u4437ot;\u417C\u0100et\u3B5D\u3B61tr\xE6\u155Fa;\u43B6r;\uC000\u{1D537}cy;\u4436grarr;\u61DDpf;\uC000\u{1D56B}cr;\uC000\u{1D4CF}\u0100jn\u3B85\u3B87;\u600Dj;\u600C'.split("").map(e=>e.charCodeAt(0)));var Cm=new Uint16Array("\u0200aglq	\x1B\u026D\0\0p;\u4026os;\u4027t;\u403Et;\u403Cuot;\u4022".split("").map(e=>e.charCodeAt(0)));var Fl,V2=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]),Nl=(Fl=String.fromCodePoint)!==null&&Fl!==void 0?Fl:function(e){let n="";return e>65535&&(e-=65536,n+=String.fromCharCode(e>>>10&1023|55296),e=56320|e&1023),n+=String.fromCharCode(e),n};function Rl(e){var n;return e>=55296&&e<=57343||e>1114111?65533:(n=V2.get(e))!==null&&n!==void 0?n:e}var ge;(function(e){e[e.NUM=35]="NUM",e[e.SEMI=59]="SEMI",e[e.EQUALS=61]="EQUALS",e[e.ZERO=48]="ZERO",e[e.NINE=57]="NINE",e[e.LOWER_A=97]="LOWER_A",e[e.LOWER_F=102]="LOWER_F",e[e.LOWER_X=120]="LOWER_X",e[e.LOWER_Z=122]="LOWER_Z",e[e.UPPER_A=65]="UPPER_A",e[e.UPPER_F=70]="UPPER_F",e[e.UPPER_Z=90]="UPPER_Z"})(ge||(ge={}));var $2=32,At;(function(e){e[e.VALUE_LENGTH=49152]="VALUE_LENGTH",e[e.BRANCH_LENGTH=16256]="BRANCH_LENGTH",e[e.JUMP_TABLE=127]="JUMP_TABLE"})(At||(At={}));function Il(e){return e>=ge.ZERO&&e<=ge.NINE}function W2(e){return e>=ge.UPPER_A&&e<=ge.UPPER_F||e>=ge.LOWER_A&&e<=ge.LOWER_F}function Q2(e){return e>=ge.UPPER_A&&e<=ge.UPPER_Z||e>=ge.LOWER_A&&e<=ge.LOWER_Z||Il(e)}function Z2(e){return e===ge.EQUALS||Q2(e)}var he;(function(e){e[e.EntityStart=0]="EntityStart",e[e.NumericStart=1]="NumericStart",e[e.NumericDecimal=2]="NumericDecimal",e[e.NumericHex=3]="NumericHex",e[e.NamedEntity=4]="NamedEntity"})(he||(he={}));var Mn;(function(e){e[e.Legacy=0]="Legacy",e[e.Strict=1]="Strict",e[e.Attribute=2]="Attribute"})(Mn||(Mn={}));var Ra=class{constructor(n,t,r){this.decodeTree=n,this.emitCodePoint=t,this.errors=r,this.state=he.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=Mn.Strict}startEntity(n){this.decodeMode=n,this.state=he.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(n,t){switch(this.state){case he.EntityStart:return n.charCodeAt(t)===ge.NUM?(this.state=he.NumericStart,this.consumed+=1,this.stateNumericStart(n,t+1)):(this.state=he.NamedEntity,this.stateNamedEntity(n,t));case he.NumericStart:return this.stateNumericStart(n,t);case he.NumericDecimal:return this.stateNumericDecimal(n,t);case he.NumericHex:return this.stateNumericHex(n,t);case he.NamedEntity:return this.stateNamedEntity(n,t)}}stateNumericStart(n,t){return t>=n.length?-1:(n.charCodeAt(t)|$2)===ge.LOWER_X?(this.state=he.NumericHex,this.consumed+=1,this.stateNumericHex(n,t+1)):(this.state=he.NumericDecimal,this.stateNumericDecimal(n,t))}addToNumericResult(n,t,r,o){if(t!==r){let u=r-t;this.result=this.result*Math.pow(o,u)+parseInt(n.substr(t,u),o),this.consumed+=u}}stateNumericHex(n,t){let r=t;for(;t<n.length;){let o=n.charCodeAt(t);if(Il(o)||W2(o))t+=1;else return this.addToNumericResult(n,r,t,16),this.emitNumericEntity(o,3)}return this.addToNumericResult(n,r,t,16),-1}stateNumericDecimal(n,t){let r=t;for(;t<n.length;){let o=n.charCodeAt(t);if(Il(o))t+=1;else return this.addToNumericResult(n,r,t,10),this.emitNumericEntity(o,2)}return this.addToNumericResult(n,r,t,10),-1}emitNumericEntity(n,t){var r;if(this.consumed<=t)return(r=this.errors)===null||r===void 0||r.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(n===ge.SEMI)this.consumed+=1;else if(this.decodeMode===Mn.Strict)return 0;return this.emitCodePoint(Rl(this.result),this.consumed),this.errors&&(n!==ge.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(n,t){let{decodeTree:r}=this,o=r[this.treeIndex],u=(o&At.VALUE_LENGTH)>>14;for(;t<n.length;t++,this.excess++){let a=n.charCodeAt(t);if(this.treeIndex=G2(r,o,this.treeIndex+Math.max(1,u),a),this.treeIndex<0)return this.result===0||this.decodeMode===Mn.Attribute&&(u===0||Z2(a))?0:this.emitNotTerminatedNamedEntity();if(o=r[this.treeIndex],u=(o&At.VALUE_LENGTH)>>14,u!==0){if(a===ge.SEMI)return this.emitNamedEntityData(this.treeIndex,u,this.consumed+this.excess);this.decodeMode!==Mn.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var n;let{result:t,decodeTree:r}=this,o=(r[t]&At.VALUE_LENGTH)>>14;return this.emitNamedEntityData(t,o,this.consumed),(n=this.errors)===null||n===void 0||n.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(n,t,r){let{decodeTree:o}=this;return this.emitCodePoint(t===1?o[n]&~At.VALUE_LENGTH:o[n+1],r),t===3&&this.emitCodePoint(o[n+2],r),r}end(){var n;switch(this.state){case he.NamedEntity:return this.result!==0&&(this.decodeMode!==Mn.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case he.NumericDecimal:return this.emitNumericEntity(0,2);case he.NumericHex:return this.emitNumericEntity(0,3);case he.NumericStart:return(n=this.errors)===null||n===void 0||n.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case he.EntityStart:return 0}}};function _m(e){let n="",t=new Ra(e,r=>n+=Nl(r));return function(o,u){let a=0,i=0;for(;(i=o.indexOf("&",i))>=0;){n+=o.slice(a,i),t.startEntity(u);let l=t.write(o,i+1);if(l<0){a=i+t.end();break}a=i+l,i=l===0?a+1:a}let s=n+o.slice(a);return n="",s}}function G2(e,n,t,r){let o=(n&At.BRANCH_LENGTH)>>7,u=n&At.JUMP_TABLE;if(o===0)return u!==0&&r===u?t:-1;if(u){let s=r-u;return s<0||s>=o?-1:e[t+s]-1}let a=t,i=a+o-1;for(;a<=i;){let s=a+i>>>1,l=e[s];if(l<r)a=s+1;else if(l>r)i=s-1;else return e[s+o]}return-1}var X2=_m(km),sy=_m(Cm);function Dt(e,n=Mn.Legacy){return X2(e,n)}function Ia(e){for(let n=1;n<e.length;n++)e[n][0]+=e[n-1][0]+1;return e}var Y2=new Map(Ia([[9,"&Tab;"],[0,"&NewLine;"],[22,"&excl;"],[0,"&quot;"],[0,"&num;"],[0,"&dollar;"],[0,"&percnt;"],[0,"&amp;"],[0,"&apos;"],[0,"&lpar;"],[0,"&rpar;"],[0,"&ast;"],[0,"&plus;"],[0,"&comma;"],[1,"&period;"],[0,"&sol;"],[10,"&colon;"],[0,"&semi;"],[0,{v:"&lt;",n:8402,o:"&nvlt;"}],[0,{v:"&equals;",n:8421,o:"&bne;"}],[0,{v:"&gt;",n:8402,o:"&nvgt;"}],[0,"&quest;"],[0,"&commat;"],[26,"&lbrack;"],[0,"&bsol;"],[0,"&rbrack;"],[0,"&Hat;"],[0,"&lowbar;"],[0,"&DiacriticalGrave;"],[5,{n:106,o:"&fjlig;"}],[20,"&lbrace;"],[0,"&verbar;"],[0,"&rbrace;"],[34,"&nbsp;"],[0,"&iexcl;"],[0,"&cent;"],[0,"&pound;"],[0,"&curren;"],[0,"&yen;"],[0,"&brvbar;"],[0,"&sect;"],[0,"&die;"],[0,"&copy;"],[0,"&ordf;"],[0,"&laquo;"],[0,"&not;"],[0,"&shy;"],[0,"&circledR;"],[0,"&macr;"],[0,"&deg;"],[0,"&PlusMinus;"],[0,"&sup2;"],[0,"&sup3;"],[0,"&acute;"],[0,"&micro;"],[0,"&para;"],[0,"&centerdot;"],[0,"&cedil;"],[0,"&sup1;"],[0,"&ordm;"],[0,"&raquo;"],[0,"&frac14;"],[0,"&frac12;"],[0,"&frac34;"],[0,"&iquest;"],[0,"&Agrave;"],[0,"&Aacute;"],[0,"&Acirc;"],[0,"&Atilde;"],[0,"&Auml;"],[0,"&angst;"],[0,"&AElig;"],[0,"&Ccedil;"],[0,"&Egrave;"],[0,"&Eacute;"],[0,"&Ecirc;"],[0,"&Euml;"],[0,"&Igrave;"],[0,"&Iacute;"],[0,"&Icirc;"],[0,"&Iuml;"],[0,"&ETH;"],[0,"&Ntilde;"],[0,"&Ograve;"],[0,"&Oacute;"],[0,"&Ocirc;"],[0,"&Otilde;"],[0,"&Ouml;"],[0,"&times;"],[0,"&Oslash;"],[0,"&Ugrave;"],[0,"&Uacute;"],[0,"&Ucirc;"],[0,"&Uuml;"],[0,"&Yacute;"],[0,"&THORN;"],[0,"&szlig;"],[0,"&agrave;"],[0,"&aacute;"],[0,"&acirc;"],[0,"&atilde;"],[0,"&auml;"],[0,"&aring;"],[0,"&aelig;"],[0,"&ccedil;"],[0,"&egrave;"],[0,"&eacute;"],[0,"&ecirc;"],[0,"&euml;"],[0,"&igrave;"],[0,"&iacute;"],[0,"&icirc;"],[0,"&iuml;"],[0,"&eth;"],[0,"&ntilde;"],[0,"&ograve;"],[0,"&oacute;"],[0,"&ocirc;"],[0,"&otilde;"],[0,"&ouml;"],[0,"&div;"],[0,"&oslash;"],[0,"&ugrave;"],[0,"&uacute;"],[0,"&ucirc;"],[0,"&uuml;"],[0,"&yacute;"],[0,"&thorn;"],[0,"&yuml;"],[0,"&Amacr;"],[0,"&amacr;"],[0,"&Abreve;"],[0,"&abreve;"],[0,"&Aogon;"],[0,"&aogon;"],[0,"&Cacute;"],[0,"&cacute;"],[0,"&Ccirc;"],[0,"&ccirc;"],[0,"&Cdot;"],[0,"&cdot;"],[0,"&Ccaron;"],[0,"&ccaron;"],[0,"&Dcaron;"],[0,"&dcaron;"],[0,"&Dstrok;"],[0,"&dstrok;"],[0,"&Emacr;"],[0,"&emacr;"],[2,"&Edot;"],[0,"&edot;"],[0,"&Eogon;"],[0,"&eogon;"],[0,"&Ecaron;"],[0,"&ecaron;"],[0,"&Gcirc;"],[0,"&gcirc;"],[0,"&Gbreve;"],[0,"&gbreve;"],[0,"&Gdot;"],[0,"&gdot;"],[0,"&Gcedil;"],[1,"&Hcirc;"],[0,"&hcirc;"],[0,"&Hstrok;"],[0,"&hstrok;"],[0,"&Itilde;"],[0,"&itilde;"],[0,"&Imacr;"],[0,"&imacr;"],[2,"&Iogon;"],[0,"&iogon;"],[0,"&Idot;"],[0,"&imath;"],[0,"&IJlig;"],[0,"&ijlig;"],[0,"&Jcirc;"],[0,"&jcirc;"],[0,"&Kcedil;"],[0,"&kcedil;"],[0,"&kgreen;"],[0,"&Lacute;"],[0,"&lacute;"],[0,"&Lcedil;"],[0,"&lcedil;"],[0,"&Lcaron;"],[0,"&lcaron;"],[0,"&Lmidot;"],[0,"&lmidot;"],[0,"&Lstrok;"],[0,"&lstrok;"],[0,"&Nacute;"],[0,"&nacute;"],[0,"&Ncedil;"],[0,"&ncedil;"],[0,"&Ncaron;"],[0,"&ncaron;"],[0,"&napos;"],[0,"&ENG;"],[0,"&eng;"],[0,"&Omacr;"],[0,"&omacr;"],[2,"&Odblac;"],[0,"&odblac;"],[0,"&OElig;"],[0,"&oelig;"],[0,"&Racute;"],[0,"&racute;"],[0,"&Rcedil;"],[0,"&rcedil;"],[0,"&Rcaron;"],[0,"&rcaron;"],[0,"&Sacute;"],[0,"&sacute;"],[0,"&Scirc;"],[0,"&scirc;"],[0,"&Scedil;"],[0,"&scedil;"],[0,"&Scaron;"],[0,"&scaron;"],[0,"&Tcedil;"],[0,"&tcedil;"],[0,"&Tcaron;"],[0,"&tcaron;"],[0,"&Tstrok;"],[0,"&tstrok;"],[0,"&Utilde;"],[0,"&utilde;"],[0,"&Umacr;"],[0,"&umacr;"],[0,"&Ubreve;"],[0,"&ubreve;"],[0,"&Uring;"],[0,"&uring;"],[0,"&Udblac;"],[0,"&udblac;"],[0,"&Uogon;"],[0,"&uogon;"],[0,"&Wcirc;"],[0,"&wcirc;"],[0,"&Ycirc;"],[0,"&ycirc;"],[0,"&Yuml;"],[0,"&Zacute;"],[0,"&zacute;"],[0,"&Zdot;"],[0,"&zdot;"],[0,"&Zcaron;"],[0,"&zcaron;"],[19,"&fnof;"],[34,"&imped;"],[63,"&gacute;"],[65,"&jmath;"],[142,"&circ;"],[0,"&caron;"],[16,"&breve;"],[0,"&DiacriticalDot;"],[0,"&ring;"],[0,"&ogon;"],[0,"&DiacriticalTilde;"],[0,"&dblac;"],[51,"&DownBreve;"],[127,"&Alpha;"],[0,"&Beta;"],[0,"&Gamma;"],[0,"&Delta;"],[0,"&Epsilon;"],[0,"&Zeta;"],[0,"&Eta;"],[0,"&Theta;"],[0,"&Iota;"],[0,"&Kappa;"],[0,"&Lambda;"],[0,"&Mu;"],[0,"&Nu;"],[0,"&Xi;"],[0,"&Omicron;"],[0,"&Pi;"],[0,"&Rho;"],[1,"&Sigma;"],[0,"&Tau;"],[0,"&Upsilon;"],[0,"&Phi;"],[0,"&Chi;"],[0,"&Psi;"],[0,"&ohm;"],[7,"&alpha;"],[0,"&beta;"],[0,"&gamma;"],[0,"&delta;"],[0,"&epsi;"],[0,"&zeta;"],[0,"&eta;"],[0,"&theta;"],[0,"&iota;"],[0,"&kappa;"],[0,"&lambda;"],[0,"&mu;"],[0,"&nu;"],[0,"&xi;"],[0,"&omicron;"],[0,"&pi;"],[0,"&rho;"],[0,"&sigmaf;"],[0,"&sigma;"],[0,"&tau;"],[0,"&upsi;"],[0,"&phi;"],[0,"&chi;"],[0,"&psi;"],[0,"&omega;"],[7,"&thetasym;"],[0,"&Upsi;"],[2,"&phiv;"],[0,"&piv;"],[5,"&Gammad;"],[0,"&digamma;"],[18,"&kappav;"],[0,"&rhov;"],[3,"&epsiv;"],[0,"&backepsilon;"],[10,"&IOcy;"],[0,"&DJcy;"],[0,"&GJcy;"],[0,"&Jukcy;"],[0,"&DScy;"],[0,"&Iukcy;"],[0,"&YIcy;"],[0,"&Jsercy;"],[0,"&LJcy;"],[0,"&NJcy;"],[0,"&TSHcy;"],[0,"&KJcy;"],[1,"&Ubrcy;"],[0,"&DZcy;"],[0,"&Acy;"],[0,"&Bcy;"],[0,"&Vcy;"],[0,"&Gcy;"],[0,"&Dcy;"],[0,"&IEcy;"],[0,"&ZHcy;"],[0,"&Zcy;"],[0,"&Icy;"],[0,"&Jcy;"],[0,"&Kcy;"],[0,"&Lcy;"],[0,"&Mcy;"],[0,"&Ncy;"],[0,"&Ocy;"],[0,"&Pcy;"],[0,"&Rcy;"],[0,"&Scy;"],[0,"&Tcy;"],[0,"&Ucy;"],[0,"&Fcy;"],[0,"&KHcy;"],[0,"&TScy;"],[0,"&CHcy;"],[0,"&SHcy;"],[0,"&SHCHcy;"],[0,"&HARDcy;"],[0,"&Ycy;"],[0,"&SOFTcy;"],[0,"&Ecy;"],[0,"&YUcy;"],[0,"&YAcy;"],[0,"&acy;"],[0,"&bcy;"],[0,"&vcy;"],[0,"&gcy;"],[0,"&dcy;"],[0,"&iecy;"],[0,"&zhcy;"],[0,"&zcy;"],[0,"&icy;"],[0,"&jcy;"],[0,"&kcy;"],[0,"&lcy;"],[0,"&mcy;"],[0,"&ncy;"],[0,"&ocy;"],[0,"&pcy;"],[0,"&rcy;"],[0,"&scy;"],[0,"&tcy;"],[0,"&ucy;"],[0,"&fcy;"],[0,"&khcy;"],[0,"&tscy;"],[0,"&chcy;"],[0,"&shcy;"],[0,"&shchcy;"],[0,"&hardcy;"],[0,"&ycy;"],[0,"&softcy;"],[0,"&ecy;"],[0,"&yucy;"],[0,"&yacy;"],[1,"&iocy;"],[0,"&djcy;"],[0,"&gjcy;"],[0,"&jukcy;"],[0,"&dscy;"],[0,"&iukcy;"],[0,"&yicy;"],[0,"&jsercy;"],[0,"&ljcy;"],[0,"&njcy;"],[0,"&tshcy;"],[0,"&kjcy;"],[1,"&ubrcy;"],[0,"&dzcy;"],[7074,"&ensp;"],[0,"&emsp;"],[0,"&emsp13;"],[0,"&emsp14;"],[1,"&numsp;"],[0,"&puncsp;"],[0,"&ThinSpace;"],[0,"&hairsp;"],[0,"&NegativeMediumSpace;"],[0,"&zwnj;"],[0,"&zwj;"],[0,"&lrm;"],[0,"&rlm;"],[0,"&dash;"],[2,"&ndash;"],[0,"&mdash;"],[0,"&horbar;"],[0,"&Verbar;"],[1,"&lsquo;"],[0,"&CloseCurlyQuote;"],[0,"&lsquor;"],[1,"&ldquo;"],[0,"&CloseCurlyDoubleQuote;"],[0,"&bdquo;"],[1,"&dagger;"],[0,"&Dagger;"],[0,"&bull;"],[2,"&nldr;"],[0,"&hellip;"],[9,"&permil;"],[0,"&pertenk;"],[0,"&prime;"],[0,"&Prime;"],[0,"&tprime;"],[0,"&backprime;"],[3,"&lsaquo;"],[0,"&rsaquo;"],[3,"&oline;"],[2,"&caret;"],[1,"&hybull;"],[0,"&frasl;"],[10,"&bsemi;"],[7,"&qprime;"],[7,{v:"&MediumSpace;",n:8202,o:"&ThickSpace;"}],[0,"&NoBreak;"],[0,"&af;"],[0,"&InvisibleTimes;"],[0,"&ic;"],[72,"&euro;"],[46,"&tdot;"],[0,"&DotDot;"],[37,"&complexes;"],[2,"&incare;"],[4,"&gscr;"],[0,"&hamilt;"],[0,"&Hfr;"],[0,"&Hopf;"],[0,"&planckh;"],[0,"&hbar;"],[0,"&imagline;"],[0,"&Ifr;"],[0,"&lagran;"],[0,"&ell;"],[1,"&naturals;"],[0,"&numero;"],[0,"&copysr;"],[0,"&weierp;"],[0,"&Popf;"],[0,"&Qopf;"],[0,"&realine;"],[0,"&real;"],[0,"&reals;"],[0,"&rx;"],[3,"&trade;"],[1,"&integers;"],[2,"&mho;"],[0,"&zeetrf;"],[0,"&iiota;"],[2,"&bernou;"],[0,"&Cayleys;"],[1,"&escr;"],[0,"&Escr;"],[0,"&Fouriertrf;"],[1,"&Mellintrf;"],[0,"&order;"],[0,"&alefsym;"],[0,"&beth;"],[0,"&gimel;"],[0,"&daleth;"],[12,"&CapitalDifferentialD;"],[0,"&dd;"],[0,"&ee;"],[0,"&ii;"],[10,"&frac13;"],[0,"&frac23;"],[0,"&frac15;"],[0,"&frac25;"],[0,"&frac35;"],[0,"&frac45;"],[0,"&frac16;"],[0,"&frac56;"],[0,"&frac18;"],[0,"&frac38;"],[0,"&frac58;"],[0,"&frac78;"],[49,"&larr;"],[0,"&ShortUpArrow;"],[0,"&rarr;"],[0,"&darr;"],[0,"&harr;"],[0,"&updownarrow;"],[0,"&nwarr;"],[0,"&nearr;"],[0,"&LowerRightArrow;"],[0,"&LowerLeftArrow;"],[0,"&nlarr;"],[0,"&nrarr;"],[1,{v:"&rarrw;",n:824,o:"&nrarrw;"}],[0,"&Larr;"],[0,"&Uarr;"],[0,"&Rarr;"],[0,"&Darr;"],[0,"&larrtl;"],[0,"&rarrtl;"],[0,"&LeftTeeArrow;"],[0,"&mapstoup;"],[0,"&map;"],[0,"&DownTeeArrow;"],[1,"&hookleftarrow;"],[0,"&hookrightarrow;"],[0,"&larrlp;"],[0,"&looparrowright;"],[0,"&harrw;"],[0,"&nharr;"],[1,"&lsh;"],[0,"&rsh;"],[0,"&ldsh;"],[0,"&rdsh;"],[1,"&crarr;"],[0,"&cularr;"],[0,"&curarr;"],[2,"&circlearrowleft;"],[0,"&circlearrowright;"],[0,"&leftharpoonup;"],[0,"&DownLeftVector;"],[0,"&RightUpVector;"],[0,"&LeftUpVector;"],[0,"&rharu;"],[0,"&DownRightVector;"],[0,"&dharr;"],[0,"&dharl;"],[0,"&RightArrowLeftArrow;"],[0,"&udarr;"],[0,"&LeftArrowRightArrow;"],[0,"&leftleftarrows;"],[0,"&upuparrows;"],[0,"&rightrightarrows;"],[0,"&ddarr;"],[0,"&leftrightharpoons;"],[0,"&Equilibrium;"],[0,"&nlArr;"],[0,"&nhArr;"],[0,"&nrArr;"],[0,"&DoubleLeftArrow;"],[0,"&DoubleUpArrow;"],[0,"&DoubleRightArrow;"],[0,"&dArr;"],[0,"&DoubleLeftRightArrow;"],[0,"&DoubleUpDownArrow;"],[0,"&nwArr;"],[0,"&neArr;"],[0,"&seArr;"],[0,"&swArr;"],[0,"&lAarr;"],[0,"&rAarr;"],[1,"&zigrarr;"],[6,"&larrb;"],[0,"&rarrb;"],[15,"&DownArrowUpArrow;"],[7,"&loarr;"],[0,"&roarr;"],[0,"&hoarr;"],[0,"&forall;"],[0,"&comp;"],[0,{v:"&part;",n:824,o:"&npart;"}],[0,"&exist;"],[0,"&nexist;"],[0,"&empty;"],[1,"&Del;"],[0,"&Element;"],[0,"&NotElement;"],[1,"&ni;"],[0,"&notni;"],[2,"&prod;"],[0,"&coprod;"],[0,"&sum;"],[0,"&minus;"],[0,"&MinusPlus;"],[0,"&dotplus;"],[1,"&Backslash;"],[0,"&lowast;"],[0,"&compfn;"],[1,"&radic;"],[2,"&prop;"],[0,"&infin;"],[0,"&angrt;"],[0,{v:"&ang;",n:8402,o:"&nang;"}],[0,"&angmsd;"],[0,"&angsph;"],[0,"&mid;"],[0,"&nmid;"],[0,"&DoubleVerticalBar;"],[0,"&NotDoubleVerticalBar;"],[0,"&and;"],[0,"&or;"],[0,{v:"&cap;",n:65024,o:"&caps;"}],[0,{v:"&cup;",n:65024,o:"&cups;"}],[0,"&int;"],[0,"&Int;"],[0,"&iiint;"],[0,"&conint;"],[0,"&Conint;"],[0,"&Cconint;"],[0,"&cwint;"],[0,"&ClockwiseContourIntegral;"],[0,"&awconint;"],[0,"&there4;"],[0,"&becaus;"],[0,"&ratio;"],[0,"&Colon;"],[0,"&dotminus;"],[1,"&mDDot;"],[0,"&homtht;"],[0,{v:"&sim;",n:8402,o:"&nvsim;"}],[0,{v:"&backsim;",n:817,o:"&race;"}],[0,{v:"&ac;",n:819,o:"&acE;"}],[0,"&acd;"],[0,"&VerticalTilde;"],[0,"&NotTilde;"],[0,{v:"&eqsim;",n:824,o:"&nesim;"}],[0,"&sime;"],[0,"&NotTildeEqual;"],[0,"&cong;"],[0,"&simne;"],[0,"&ncong;"],[0,"&ap;"],[0,"&nap;"],[0,"&ape;"],[0,{v:"&apid;",n:824,o:"&napid;"}],[0,"&backcong;"],[0,{v:"&asympeq;",n:8402,o:"&nvap;"}],[0,{v:"&bump;",n:824,o:"&nbump;"}],[0,{v:"&bumpe;",n:824,o:"&nbumpe;"}],[0,{v:"&doteq;",n:824,o:"&nedot;"}],[0,"&doteqdot;"],[0,"&efDot;"],[0,"&erDot;"],[0,"&Assign;"],[0,"&ecolon;"],[0,"&ecir;"],[0,"&circeq;"],[1,"&wedgeq;"],[0,"&veeeq;"],[1,"&triangleq;"],[2,"&equest;"],[0,"&ne;"],[0,{v:"&Congruent;",n:8421,o:"&bnequiv;"}],[0,"&nequiv;"],[1,{v:"&le;",n:8402,o:"&nvle;"}],[0,{v:"&ge;",n:8402,o:"&nvge;"}],[0,{v:"&lE;",n:824,o:"&nlE;"}],[0,{v:"&gE;",n:824,o:"&ngE;"}],[0,{v:"&lnE;",n:65024,o:"&lvertneqq;"}],[0,{v:"&gnE;",n:65024,o:"&gvertneqq;"}],[0,{v:"&ll;",n:new Map(Ia([[824,"&nLtv;"],[7577,"&nLt;"]]))}],[0,{v:"&gg;",n:new Map(Ia([[824,"&nGtv;"],[7577,"&nGt;"]]))}],[0,"&between;"],[0,"&NotCupCap;"],[0,"&nless;"],[0,"&ngt;"],[0,"&nle;"],[0,"&nge;"],[0,"&lesssim;"],[0,"&GreaterTilde;"],[0,"&nlsim;"],[0,"&ngsim;"],[0,"&LessGreater;"],[0,"&gl;"],[0,"&NotLessGreater;"],[0,"&NotGreaterLess;"],[0,"&pr;"],[0,"&sc;"],[0,"&prcue;"],[0,"&sccue;"],[0,"&PrecedesTilde;"],[0,{v:"&scsim;",n:824,o:"&NotSucceedsTilde;"}],[0,"&NotPrecedes;"],[0,"&NotSucceeds;"],[0,{v:"&sub;",n:8402,o:"&NotSubset;"}],[0,{v:"&sup;",n:8402,o:"&NotSuperset;"}],[0,"&nsub;"],[0,"&nsup;"],[0,"&sube;"],[0,"&supe;"],[0,"&NotSubsetEqual;"],[0,"&NotSupersetEqual;"],[0,{v:"&subne;",n:65024,o:"&varsubsetneq;"}],[0,{v:"&supne;",n:65024,o:"&varsupsetneq;"}],[1,"&cupdot;"],[0,"&UnionPlus;"],[0,{v:"&sqsub;",n:824,o:"&NotSquareSubset;"}],[0,{v:"&sqsup;",n:824,o:"&NotSquareSuperset;"}],[0,"&sqsube;"],[0,"&sqsupe;"],[0,{v:"&sqcap;",n:65024,o:"&sqcaps;"}],[0,{v:"&sqcup;",n:65024,o:"&sqcups;"}],[0,"&CirclePlus;"],[0,"&CircleMinus;"],[0,"&CircleTimes;"],[0,"&osol;"],[0,"&CircleDot;"],[0,"&circledcirc;"],[0,"&circledast;"],[1,"&circleddash;"],[0,"&boxplus;"],[0,"&boxminus;"],[0,"&boxtimes;"],[0,"&dotsquare;"],[0,"&RightTee;"],[0,"&dashv;"],[0,"&DownTee;"],[0,"&bot;"],[1,"&models;"],[0,"&DoubleRightTee;"],[0,"&Vdash;"],[0,"&Vvdash;"],[0,"&VDash;"],[0,"&nvdash;"],[0,"&nvDash;"],[0,"&nVdash;"],[0,"&nVDash;"],[0,"&prurel;"],[1,"&LeftTriangle;"],[0,"&RightTriangle;"],[0,{v:"&LeftTriangleEqual;",n:8402,o:"&nvltrie;"}],[0,{v:"&RightTriangleEqual;",n:8402,o:"&nvrtrie;"}],[0,"&origof;"],[0,"&imof;"],[0,"&multimap;"],[0,"&hercon;"],[0,"&intcal;"],[0,"&veebar;"],[1,"&barvee;"],[0,"&angrtvb;"],[0,"&lrtri;"],[0,"&bigwedge;"],[0,"&bigvee;"],[0,"&bigcap;"],[0,"&bigcup;"],[0,"&diam;"],[0,"&sdot;"],[0,"&sstarf;"],[0,"&divideontimes;"],[0,"&bowtie;"],[0,"&ltimes;"],[0,"&rtimes;"],[0,"&leftthreetimes;"],[0,"&rightthreetimes;"],[0,"&backsimeq;"],[0,"&curlyvee;"],[0,"&curlywedge;"],[0,"&Sub;"],[0,"&Sup;"],[0,"&Cap;"],[0,"&Cup;"],[0,"&fork;"],[0,"&epar;"],[0,"&lessdot;"],[0,"&gtdot;"],[0,{v:"&Ll;",n:824,o:"&nLl;"}],[0,{v:"&Gg;",n:824,o:"&nGg;"}],[0,{v:"&leg;",n:65024,o:"&lesg;"}],[0,{v:"&gel;",n:65024,o:"&gesl;"}],[2,"&cuepr;"],[0,"&cuesc;"],[0,"&NotPrecedesSlantEqual;"],[0,"&NotSucceedsSlantEqual;"],[0,"&NotSquareSubsetEqual;"],[0,"&NotSquareSupersetEqual;"],[2,"&lnsim;"],[0,"&gnsim;"],[0,"&precnsim;"],[0,"&scnsim;"],[0,"&nltri;"],[0,"&NotRightTriangle;"],[0,"&nltrie;"],[0,"&NotRightTriangleEqual;"],[0,"&vellip;"],[0,"&ctdot;"],[0,"&utdot;"],[0,"&dtdot;"],[0,"&disin;"],[0,"&isinsv;"],[0,"&isins;"],[0,{v:"&isindot;",n:824,o:"&notindot;"}],[0,"&notinvc;"],[0,"&notinvb;"],[1,{v:"&isinE;",n:824,o:"&notinE;"}],[0,"&nisd;"],[0,"&xnis;"],[0,"&nis;"],[0,"&notnivc;"],[0,"&notnivb;"],[6,"&barwed;"],[0,"&Barwed;"],[1,"&lceil;"],[0,"&rceil;"],[0,"&LeftFloor;"],[0,"&rfloor;"],[0,"&drcrop;"],[0,"&dlcrop;"],[0,"&urcrop;"],[0,"&ulcrop;"],[0,"&bnot;"],[1,"&profline;"],[0,"&profsurf;"],[1,"&telrec;"],[0,"&target;"],[5,"&ulcorn;"],[0,"&urcorn;"],[0,"&dlcorn;"],[0,"&drcorn;"],[2,"&frown;"],[0,"&smile;"],[9,"&cylcty;"],[0,"&profalar;"],[7,"&topbot;"],[6,"&ovbar;"],[1,"&solbar;"],[60,"&angzarr;"],[51,"&lmoustache;"],[0,"&rmoustache;"],[2,"&OverBracket;"],[0,"&bbrk;"],[0,"&bbrktbrk;"],[37,"&OverParenthesis;"],[0,"&UnderParenthesis;"],[0,"&OverBrace;"],[0,"&UnderBrace;"],[2,"&trpezium;"],[4,"&elinters;"],[59,"&blank;"],[164,"&circledS;"],[55,"&boxh;"],[1,"&boxv;"],[9,"&boxdr;"],[3,"&boxdl;"],[3,"&boxur;"],[3,"&boxul;"],[3,"&boxvr;"],[7,"&boxvl;"],[7,"&boxhd;"],[7,"&boxhu;"],[7,"&boxvh;"],[19,"&boxH;"],[0,"&boxV;"],[0,"&boxdR;"],[0,"&boxDr;"],[0,"&boxDR;"],[0,"&boxdL;"],[0,"&boxDl;"],[0,"&boxDL;"],[0,"&boxuR;"],[0,"&boxUr;"],[0,"&boxUR;"],[0,"&boxuL;"],[0,"&boxUl;"],[0,"&boxUL;"],[0,"&boxvR;"],[0,"&boxVr;"],[0,"&boxVR;"],[0,"&boxvL;"],[0,"&boxVl;"],[0,"&boxVL;"],[0,"&boxHd;"],[0,"&boxhD;"],[0,"&boxHD;"],[0,"&boxHu;"],[0,"&boxhU;"],[0,"&boxHU;"],[0,"&boxvH;"],[0,"&boxVh;"],[0,"&boxVH;"],[19,"&uhblk;"],[3,"&lhblk;"],[3,"&block;"],[8,"&blk14;"],[0,"&blk12;"],[0,"&blk34;"],[13,"&square;"],[8,"&blacksquare;"],[0,"&EmptyVerySmallSquare;"],[1,"&rect;"],[0,"&marker;"],[2,"&fltns;"],[1,"&bigtriangleup;"],[0,"&blacktriangle;"],[0,"&triangle;"],[2,"&blacktriangleright;"],[0,"&rtri;"],[3,"&bigtriangledown;"],[0,"&blacktriangledown;"],[0,"&dtri;"],[2,"&blacktriangleleft;"],[0,"&ltri;"],[6,"&loz;"],[0,"&cir;"],[32,"&tridot;"],[2,"&bigcirc;"],[8,"&ultri;"],[0,"&urtri;"],[0,"&lltri;"],[0,"&EmptySmallSquare;"],[0,"&FilledSmallSquare;"],[8,"&bigstar;"],[0,"&star;"],[7,"&phone;"],[49,"&female;"],[1,"&male;"],[29,"&spades;"],[2,"&clubs;"],[1,"&hearts;"],[0,"&diamondsuit;"],[3,"&sung;"],[2,"&flat;"],[0,"&natural;"],[0,"&sharp;"],[163,"&check;"],[3,"&cross;"],[8,"&malt;"],[21,"&sext;"],[33,"&VerticalSeparator;"],[25,"&lbbrk;"],[0,"&rbbrk;"],[84,"&bsolhsub;"],[0,"&suphsol;"],[28,"&LeftDoubleBracket;"],[0,"&RightDoubleBracket;"],[0,"&lang;"],[0,"&rang;"],[0,"&Lang;"],[0,"&Rang;"],[0,"&loang;"],[0,"&roang;"],[7,"&longleftarrow;"],[0,"&longrightarrow;"],[0,"&longleftrightarrow;"],[0,"&DoubleLongLeftArrow;"],[0,"&DoubleLongRightArrow;"],[0,"&DoubleLongLeftRightArrow;"],[1,"&longmapsto;"],[2,"&dzigrarr;"],[258,"&nvlArr;"],[0,"&nvrArr;"],[0,"&nvHarr;"],[0,"&Map;"],[6,"&lbarr;"],[0,"&bkarow;"],[0,"&lBarr;"],[0,"&dbkarow;"],[0,"&drbkarow;"],[0,"&DDotrahd;"],[0,"&UpArrowBar;"],[0,"&DownArrowBar;"],[2,"&Rarrtl;"],[2,"&latail;"],[0,"&ratail;"],[0,"&lAtail;"],[0,"&rAtail;"],[0,"&larrfs;"],[0,"&rarrfs;"],[0,"&larrbfs;"],[0,"&rarrbfs;"],[2,"&nwarhk;"],[0,"&nearhk;"],[0,"&hksearow;"],[0,"&hkswarow;"],[0,"&nwnear;"],[0,"&nesear;"],[0,"&seswar;"],[0,"&swnwar;"],[8,{v:"&rarrc;",n:824,o:"&nrarrc;"}],[1,"&cudarrr;"],[0,"&ldca;"],[0,"&rdca;"],[0,"&cudarrl;"],[0,"&larrpl;"],[2,"&curarrm;"],[0,"&cularrp;"],[7,"&rarrpl;"],[2,"&harrcir;"],[0,"&Uarrocir;"],[0,"&lurdshar;"],[0,"&ldrushar;"],[2,"&LeftRightVector;"],[0,"&RightUpDownVector;"],[0,"&DownLeftRightVector;"],[0,"&LeftUpDownVector;"],[0,"&LeftVectorBar;"],[0,"&RightVectorBar;"],[0,"&RightUpVectorBar;"],[0,"&RightDownVectorBar;"],[0,"&DownLeftVectorBar;"],[0,"&DownRightVectorBar;"],[0,"&LeftUpVectorBar;"],[0,"&LeftDownVectorBar;"],[0,"&LeftTeeVector;"],[0,"&RightTeeVector;"],[0,"&RightUpTeeVector;"],[0,"&RightDownTeeVector;"],[0,"&DownLeftTeeVector;"],[0,"&DownRightTeeVector;"],[0,"&LeftUpTeeVector;"],[0,"&LeftDownTeeVector;"],[0,"&lHar;"],[0,"&uHar;"],[0,"&rHar;"],[0,"&dHar;"],[0,"&luruhar;"],[0,"&ldrdhar;"],[0,"&ruluhar;"],[0,"&rdldhar;"],[0,"&lharul;"],[0,"&llhard;"],[0,"&rharul;"],[0,"&lrhard;"],[0,"&udhar;"],[0,"&duhar;"],[0,"&RoundImplies;"],[0,"&erarr;"],[0,"&simrarr;"],[0,"&larrsim;"],[0,"&rarrsim;"],[0,"&rarrap;"],[0,"&ltlarr;"],[1,"&gtrarr;"],[0,"&subrarr;"],[1,"&suplarr;"],[0,"&lfisht;"],[0,"&rfisht;"],[0,"&ufisht;"],[0,"&dfisht;"],[5,"&lopar;"],[0,"&ropar;"],[4,"&lbrke;"],[0,"&rbrke;"],[0,"&lbrkslu;"],[0,"&rbrksld;"],[0,"&lbrksld;"],[0,"&rbrkslu;"],[0,"&langd;"],[0,"&rangd;"],[0,"&lparlt;"],[0,"&rpargt;"],[0,"&gtlPar;"],[0,"&ltrPar;"],[3,"&vzigzag;"],[1,"&vangrt;"],[0,"&angrtvbd;"],[6,"&ange;"],[0,"&range;"],[0,"&dwangle;"],[0,"&uwangle;"],[0,"&angmsdaa;"],[0,"&angmsdab;"],[0,"&angmsdac;"],[0,"&angmsdad;"],[0,"&angmsdae;"],[0,"&angmsdaf;"],[0,"&angmsdag;"],[0,"&angmsdah;"],[0,"&bemptyv;"],[0,"&demptyv;"],[0,"&cemptyv;"],[0,"&raemptyv;"],[0,"&laemptyv;"],[0,"&ohbar;"],[0,"&omid;"],[0,"&opar;"],[1,"&operp;"],[1,"&olcross;"],[0,"&odsold;"],[1,"&olcir;"],[0,"&ofcir;"],[0,"&olt;"],[0,"&ogt;"],[0,"&cirscir;"],[0,"&cirE;"],[0,"&solb;"],[0,"&bsolb;"],[3,"&boxbox;"],[3,"&trisb;"],[0,"&rtriltri;"],[0,{v:"&LeftTriangleBar;",n:824,o:"&NotLeftTriangleBar;"}],[0,{v:"&RightTriangleBar;",n:824,o:"&NotRightTriangleBar;"}],[11,"&iinfin;"],[0,"&infintie;"],[0,"&nvinfin;"],[4,"&eparsl;"],[0,"&smeparsl;"],[0,"&eqvparsl;"],[5,"&blacklozenge;"],[8,"&RuleDelayed;"],[1,"&dsol;"],[9,"&bigodot;"],[0,"&bigoplus;"],[0,"&bigotimes;"],[1,"&biguplus;"],[1,"&bigsqcup;"],[5,"&iiiint;"],[0,"&fpartint;"],[2,"&cirfnint;"],[0,"&awint;"],[0,"&rppolint;"],[0,"&scpolint;"],[0,"&npolint;"],[0,"&pointint;"],[0,"&quatint;"],[0,"&intlarhk;"],[10,"&pluscir;"],[0,"&plusacir;"],[0,"&simplus;"],[0,"&plusdu;"],[0,"&plussim;"],[0,"&plustwo;"],[1,"&mcomma;"],[0,"&minusdu;"],[2,"&loplus;"],[0,"&roplus;"],[0,"&Cross;"],[0,"&timesd;"],[0,"&timesbar;"],[1,"&smashp;"],[0,"&lotimes;"],[0,"&rotimes;"],[0,"&otimesas;"],[0,"&Otimes;"],[0,"&odiv;"],[0,"&triplus;"],[0,"&triminus;"],[0,"&tritime;"],[0,"&intprod;"],[2,"&amalg;"],[0,"&capdot;"],[1,"&ncup;"],[0,"&ncap;"],[0,"&capand;"],[0,"&cupor;"],[0,"&cupcap;"],[0,"&capcup;"],[0,"&cupbrcap;"],[0,"&capbrcup;"],[0,"&cupcup;"],[0,"&capcap;"],[0,"&ccups;"],[0,"&ccaps;"],[2,"&ccupssm;"],[2,"&And;"],[0,"&Or;"],[0,"&andand;"],[0,"&oror;"],[0,"&orslope;"],[0,"&andslope;"],[1,"&andv;"],[0,"&orv;"],[0,"&andd;"],[0,"&ord;"],[1,"&wedbar;"],[6,"&sdote;"],[3,"&simdot;"],[2,{v:"&congdot;",n:824,o:"&ncongdot;"}],[0,"&easter;"],[0,"&apacir;"],[0,{v:"&apE;",n:824,o:"&napE;"}],[0,"&eplus;"],[0,"&pluse;"],[0,"&Esim;"],[0,"&Colone;"],[0,"&Equal;"],[1,"&ddotseq;"],[0,"&equivDD;"],[0,"&ltcir;"],[0,"&gtcir;"],[0,"&ltquest;"],[0,"&gtquest;"],[0,{v:"&leqslant;",n:824,o:"&nleqslant;"}],[0,{v:"&geqslant;",n:824,o:"&ngeqslant;"}],[0,"&lesdot;"],[0,"&gesdot;"],[0,"&lesdoto;"],[0,"&gesdoto;"],[0,"&lesdotor;"],[0,"&gesdotol;"],[0,"&lap;"],[0,"&gap;"],[0,"&lne;"],[0,"&gne;"],[0,"&lnap;"],[0,"&gnap;"],[0,"&lEg;"],[0,"&gEl;"],[0,"&lsime;"],[0,"&gsime;"],[0,"&lsimg;"],[0,"&gsiml;"],[0,"&lgE;"],[0,"&glE;"],[0,"&lesges;"],[0,"&gesles;"],[0,"&els;"],[0,"&egs;"],[0,"&elsdot;"],[0,"&egsdot;"],[0,"&el;"],[0,"&eg;"],[2,"&siml;"],[0,"&simg;"],[0,"&simlE;"],[0,"&simgE;"],[0,{v:"&LessLess;",n:824,o:"&NotNestedLessLess;"}],[0,{v:"&GreaterGreater;",n:824,o:"&NotNestedGreaterGreater;"}],[1,"&glj;"],[0,"&gla;"],[0,"&ltcc;"],[0,"&gtcc;"],[0,"&lescc;"],[0,"&gescc;"],[0,"&smt;"],[0,"&lat;"],[0,{v:"&smte;",n:65024,o:"&smtes;"}],[0,{v:"&late;",n:65024,o:"&lates;"}],[0,"&bumpE;"],[0,{v:"&PrecedesEqual;",n:824,o:"&NotPrecedesEqual;"}],[0,{v:"&sce;",n:824,o:"&NotSucceedsEqual;"}],[2,"&prE;"],[0,"&scE;"],[0,"&precneqq;"],[0,"&scnE;"],[0,"&prap;"],[0,"&scap;"],[0,"&precnapprox;"],[0,"&scnap;"],[0,"&Pr;"],[0,"&Sc;"],[0,"&subdot;"],[0,"&supdot;"],[0,"&subplus;"],[0,"&supplus;"],[0,"&submult;"],[0,"&supmult;"],[0,"&subedot;"],[0,"&supedot;"],[0,{v:"&subE;",n:824,o:"&nsubE;"}],[0,{v:"&supE;",n:824,o:"&nsupE;"}],[0,"&subsim;"],[0,"&supsim;"],[2,{v:"&subnE;",n:65024,o:"&varsubsetneqq;"}],[0,{v:"&supnE;",n:65024,o:"&varsupsetneqq;"}],[2,"&csub;"],[0,"&csup;"],[0,"&csube;"],[0,"&csupe;"],[0,"&subsup;"],[0,"&supsub;"],[0,"&subsub;"],[0,"&supsup;"],[0,"&suphsub;"],[0,"&supdsub;"],[0,"&forkv;"],[0,"&topfork;"],[0,"&mlcp;"],[8,"&Dashv;"],[1,"&Vdashl;"],[0,"&Barv;"],[0,"&vBar;"],[0,"&vBarv;"],[1,"&Vbar;"],[0,"&Not;"],[0,"&bNot;"],[0,"&rnmid;"],[0,"&cirmid;"],[0,"&midcir;"],[0,"&topcir;"],[0,"&nhpar;"],[0,"&parsim;"],[9,{v:"&parsl;",n:8421,o:"&nparsl;"}],[44343,{n:new Map(Ia([[56476,"&Ascr;"],[1,"&Cscr;"],[0,"&Dscr;"],[2,"&Gscr;"],[2,"&Jscr;"],[0,"&Kscr;"],[2,"&Nscr;"],[0,"&Oscr;"],[0,"&Pscr;"],[0,"&Qscr;"],[1,"&Sscr;"],[0,"&Tscr;"],[0,"&Uscr;"],[0,"&Vscr;"],[0,"&Wscr;"],[0,"&Xscr;"],[0,"&Yscr;"],[0,"&Zscr;"],[0,"&ascr;"],[0,"&bscr;"],[0,"&cscr;"],[0,"&dscr;"],[1,"&fscr;"],[1,"&hscr;"],[0,"&iscr;"],[0,"&jscr;"],[0,"&kscr;"],[0,"&lscr;"],[0,"&mscr;"],[0,"&nscr;"],[1,"&pscr;"],[0,"&qscr;"],[0,"&rscr;"],[0,"&sscr;"],[0,"&tscr;"],[0,"&uscr;"],[0,"&vscr;"],[0,"&wscr;"],[0,"&xscr;"],[0,"&yscr;"],[0,"&zscr;"],[52,"&Afr;"],[0,"&Bfr;"],[1,"&Dfr;"],[0,"&Efr;"],[0,"&Ffr;"],[0,"&Gfr;"],[2,"&Jfr;"],[0,"&Kfr;"],[0,"&Lfr;"],[0,"&Mfr;"],[0,"&Nfr;"],[0,"&Ofr;"],[0,"&Pfr;"],[0,"&Qfr;"],[1,"&Sfr;"],[0,"&Tfr;"],[0,"&Ufr;"],[0,"&Vfr;"],[0,"&Wfr;"],[0,"&Xfr;"],[0,"&Yfr;"],[1,"&afr;"],[0,"&bfr;"],[0,"&cfr;"],[0,"&dfr;"],[0,"&efr;"],[0,"&ffr;"],[0,"&gfr;"],[0,"&hfr;"],[0,"&ifr;"],[0,"&jfr;"],[0,"&kfr;"],[0,"&lfr;"],[0,"&mfr;"],[0,"&nfr;"],[0,"&ofr;"],[0,"&pfr;"],[0,"&qfr;"],[0,"&rfr;"],[0,"&sfr;"],[0,"&tfr;"],[0,"&ufr;"],[0,"&vfr;"],[0,"&wfr;"],[0,"&xfr;"],[0,"&yfr;"],[0,"&zfr;"],[0,"&Aopf;"],[0,"&Bopf;"],[1,"&Dopf;"],[0,"&Eopf;"],[0,"&Fopf;"],[0,"&Gopf;"],[1,"&Iopf;"],[0,"&Jopf;"],[0,"&Kopf;"],[0,"&Lopf;"],[0,"&Mopf;"],[1,"&Oopf;"],[3,"&Sopf;"],[0,"&Topf;"],[0,"&Uopf;"],[0,"&Vopf;"],[0,"&Wopf;"],[0,"&Xopf;"],[0,"&Yopf;"],[1,"&aopf;"],[0,"&bopf;"],[0,"&copf;"],[0,"&dopf;"],[0,"&eopf;"],[0,"&fopf;"],[0,"&gopf;"],[0,"&hopf;"],[0,"&iopf;"],[0,"&jopf;"],[0,"&kopf;"],[0,"&lopf;"],[0,"&mopf;"],[0,"&nopf;"],[0,"&oopf;"],[0,"&popf;"],[0,"&qopf;"],[0,"&ropf;"],[0,"&sopf;"],[0,"&topf;"],[0,"&uopf;"],[0,"&vopf;"],[0,"&wopf;"],[0,"&xopf;"],[0,"&yopf;"],[0,"&zopf;"]]))}],[8906,"&fflig;"],[0,"&filig;"],[0,"&fllig;"],[0,"&ffilig;"],[0,"&ffllig;"]]));var K2=new Map([[34,"&quot;"],[38,"&amp;"],[39,"&apos;"],[60,"&lt;"],[62,"&gt;"]]),J2=String.prototype.codePointAt!=null?(e,n)=>e.codePointAt(n):(e,n)=>(e.charCodeAt(n)&64512)===55296?(e.charCodeAt(n)-55296)*1024+e.charCodeAt(n+1)-56320+65536:e.charCodeAt(n);function Ml(e,n){return function(r){let o,u=0,a="";for(;o=e.exec(r);)u!==o.index&&(a+=r.substring(u,o.index)),a+=n.get(o[0].charCodeAt(0)),u=o.index+1;return a+r.substring(u)}}var Sm=Ml(/[&<>'"]/g,K2),Em=Ml(/["&\u00A0]/g,new Map([[34,"&quot;"],[38,"&amp;"],[160,"&nbsp;"]])),Tm=Ml(/[&<>\u00A0]/g,new Map([[38,"&amp;"],[60,"&lt;"],[62,"&gt;"],[160,"&nbsp;"]]));var Am;(function(e){e[e.XML=0]="XML",e[e.HTML=1]="HTML"})(Am||(Am={}));var Dm;(function(e){e[e.UTF8=0]="UTF8",e[e.ASCII=1]="ASCII",e[e.Extensive=2]="Extensive",e[e.Attribute=3]="Attribute",e[e.Text=4]="Text"})(Dm||(Dm={}));function tx(e){return Object.prototype.toString.call(e)}function Ma(e){return tx(e)==="[object String]"}var rx=Object.prototype.hasOwnProperty;function ox(e,n){return rx.call(e,n)}function Br(e){return Array.prototype.slice.call(arguments,1).forEach(function(t){if(t){if(typeof t!="object")throw new TypeError(t+"must be object");Object.keys(t).forEach(function(r){e[r]=t[r]})}}),e}function Ll(e,n,t){return[].concat(e.slice(0,n),t,e.slice(n+1))}function Pa(e){return!(e>=55296&&e<=57343||e>=64976&&e<=65007||(e&65535)===65535||(e&65535)===65534||e>=0&&e<=8||e===11||e>=14&&e<=31||e>=127&&e<=159||e>1114111)}function qo(e){if(e>65535){e-=65536;let n=55296+(e>>10),t=56320+(e&1023);return String.fromCharCode(n,t)}return String.fromCharCode(e)}var Rm=/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,ux=/&([a-z#][a-z0-9]{1,31});/gi,ax=new RegExp(Rm.source+"|"+ux.source,"gi"),ix=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;function sx(e,n){if(n.charCodeAt(0)===35&&ix.test(n)){let r=n[1].toLowerCase()==="x"?parseInt(n.slice(2),16):parseInt(n.slice(1),10);return Pa(r)?qo(r):e}let t=Dt(e);return t!==e?t:e}function lx(e){return e.indexOf("\\")<0?e:e.replace(Rm,"$1")}function tt(e){return e.indexOf("\\")<0&&e.indexOf("&")<0?e:e.replace(ax,function(n,t,r){return t||sx(n,r)})}var cx=/[&<>"]/,dx=/[&<>"]/g,px={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function fx(e){return px[e]}function rt(e){return cx.test(e)?e.replace(dx,fx):e}var mx=/[.?*+^$[\]\\(){}|-]/g;function hx(e){return e.replace(mx,"\\$&")}function B(e){switch(e){case 9:case 32:return!0}return!1}function Xt(e){if(e>=8192&&e<=8202)return!0;switch(e){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1}function Yt(e){return Or.test(e)||Fa.test(e)}function Kt(e){switch(e){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}}function Jt(e){return e=e.trim().replace(/\s+/g," "),"\u1E9E".toLowerCase()==="\u1E7E"&&(e=e.replace(/ẞ/g,"\xDF")),e.toLowerCase().toUpperCase()}var gx={mdurl:Ta,ucmicro:Dl};var jl={};Qo(jl,{parseLinkDestination:()=>Bl,parseLinkLabel:()=>Ol,parseLinkTitle:()=>Ul});function Ol(e,n,t){let r,o,u,a,i=e.posMax,s=e.pos;for(e.pos=n+1,r=1;e.pos<i;){if(u=e.src.charCodeAt(e.pos),u===93&&(r--,r===0)){o=!0;break}if(a=e.pos,e.md.inline.skipToken(e),u===91){if(a===e.pos-1)r++;else if(t)return e.pos=s,-1}}let l=-1;return o&&(l=e.pos),e.pos=s,l}function Bl(e,n,t){let r,o=n,u={ok:!1,pos:0,str:""};if(e.charCodeAt(o)===60){for(o++;o<t;){if(r=e.charCodeAt(o),r===10||r===60)return u;if(r===62)return u.pos=o+1,u.str=tt(e.slice(n+1,o)),u.ok=!0,u;if(r===92&&o+1<t){o+=2;continue}o++}return u}let a=0;for(;o<t&&(r=e.charCodeAt(o),!(r===32||r<32||r===127));){if(r===92&&o+1<t){if(e.charCodeAt(o+1)===32)break;o+=2;continue}if(r===40&&(a++,a>32))return u;if(r===41){if(a===0)break;a--}o++}return n===o||a!==0||(u.str=tt(e.slice(n,o)),u.pos=o,u.ok=!0),u}function Ul(e,n,t,r){let o,u=n,a={ok:!1,can_continue:!1,pos:0,str:"",marker:0};if(r)a.str=r.str,a.marker=r.marker;else{if(u>=t)return a;let i=e.charCodeAt(u);if(i!==34&&i!==39&&i!==40)return a;n++,u++,i===40&&(i=41),a.marker=i}for(;u<t;){if(o=e.charCodeAt(u),o===a.marker)return a.pos=u+1,a.str+=tt(e.slice(n,u)),a.ok=!0,a;if(o===40&&a.marker===41)return a;o===92&&u+1<t&&u++,u++}return a.can_continue=!0,a.str+=tt(e.slice(n,u)),a}var Pn={};Pn.code_inline=function(e,n,t,r,o){let u=e[n];return"<code"+o.renderAttrs(u)+">"+rt(u.content)+"</code>"};Pn.code_block=function(e,n,t,r,o){let u=e[n];return"<pre"+o.renderAttrs(u)+"><code>"+rt(e[n].content)+`</code></pre>
`};Pn.fence=function(e,n,t,r,o){let u=e[n],a=u.info?tt(u.info).trim():"",i="",s="";if(a){let f=a.split(/(\s+)/g);i=f[0],s=f.slice(2).join("")}let l;if(t.highlight?l=t.highlight(u.content,i,s)||rt(u.content):l=rt(u.content),l.indexOf("<pre")===0)return l+`
`;if(a){let f=u.attrIndex("class"),m=u.attrs?u.attrs.slice():[];f<0?m.push(["class",t.langPrefix+i]):(m[f]=m[f].slice(),m[f][1]+=" "+t.langPrefix+i);let g={attrs:m};return`<pre><code${o.renderAttrs(g)}>${l}</code></pre>
`}return`<pre><code${o.renderAttrs(u)}>${l}</code></pre>
`};Pn.image=function(e,n,t,r,o){let u=e[n];return u.attrs[u.attrIndex("alt")][1]=o.renderInlineAsText(u.children,t,r),o.renderToken(e,n,t)};Pn.hardbreak=function(e,n,t){return t.xhtmlOut?`<br />
`:`<br>
`};Pn.softbreak=function(e,n,t){return t.breaks?t.xhtmlOut?`<br />
`:`<br>
`:`
`};Pn.text=function(e,n){return rt(e[n].content)};Pn.html_block=function(e,n){return e[n].content};Pn.html_inline=function(e,n){return e[n].content};function Ur(){this.rules=Br({},Pn)}Ur.prototype.renderAttrs=function(n){let t,r,o;if(!n.attrs)return"";for(o="",t=0,r=n.attrs.length;t<r;t++)o+=" "+rt(n.attrs[t][0])+'="'+rt(n.attrs[t][1])+'"';return o};Ur.prototype.renderToken=function(n,t,r){let o=n[t],u="";if(o.hidden)return"";o.block&&o.nesting!==-1&&t&&n[t-1].hidden&&(u+=`
`),u+=(o.nesting===-1?"</":"<")+o.tag,u+=this.renderAttrs(o),o.nesting===0&&r.xhtmlOut&&(u+=" /");let a=!1;if(o.block&&(a=!0,o.nesting===1&&t+1<n.length)){let i=n[t+1];(i.type==="inline"||i.hidden||i.nesting===-1&&i.tag===o.tag)&&(a=!1)}return u+=a?`>
`:">",u};Ur.prototype.renderInline=function(e,n,t){let r="",o=this.rules;for(let u=0,a=e.length;u<a;u++){let i=e[u].type;typeof o[i]<"u"?r+=o[i](e,u,n,t,this):r+=this.renderToken(e,u,n)}return r};Ur.prototype.renderInlineAsText=function(e,n,t){let r="";for(let o=0,u=e.length;o<u;o++)switch(e[o].type){case"text":r+=e[o].content;break;case"image":r+=this.renderInlineAsText(e[o].children,n,t);break;case"html_inline":case"html_block":r+=e[o].content;break;case"softbreak":case"hardbreak":r+=`
`;break;default:}return r};Ur.prototype.render=function(e,n,t){let r="",o=this.rules;for(let u=0,a=e.length;u<a;u++){let i=e[u].type;i==="inline"?r+=this.renderInline(e[u].children,n,t):typeof o[i]<"u"?r+=o[i](e,u,n,t,this):r+=this.renderToken(e,u,n,t)}return r};var Im=Ur;function kn(){this.__rules__=[],this.__cache__=null}kn.prototype.__find__=function(e){for(let n=0;n<this.__rules__.length;n++)if(this.__rules__[n].name===e)return n;return-1};kn.prototype.__compile__=function(){let e=this,n=[""];e.__rules__.forEach(function(t){t.enabled&&t.alt.forEach(function(r){n.indexOf(r)<0&&n.push(r)})}),e.__cache__={},n.forEach(function(t){e.__cache__[t]=[],e.__rules__.forEach(function(r){r.enabled&&(t&&r.alt.indexOf(t)<0||e.__cache__[t].push(r.fn))})})};kn.prototype.at=function(e,n,t){let r=this.__find__(e),o=t||{};if(r===-1)throw new Error("Parser rule not found: "+e);this.__rules__[r].fn=n,this.__rules__[r].alt=o.alt||[],this.__cache__=null};kn.prototype.before=function(e,n,t,r){let o=this.__find__(e),u=r||{};if(o===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(o,0,{name:n,enabled:!0,fn:t,alt:u.alt||[]}),this.__cache__=null};kn.prototype.after=function(e,n,t,r){let o=this.__find__(e),u=r||{};if(o===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(o+1,0,{name:n,enabled:!0,fn:t,alt:u.alt||[]}),this.__cache__=null};kn.prototype.push=function(e,n,t){let r=t||{};this.__rules__.push({name:e,enabled:!0,fn:n,alt:r.alt||[]}),this.__cache__=null};kn.prototype.enable=function(e,n){Array.isArray(e)||(e=[e]);let t=[];return e.forEach(function(r){let o=this.__find__(r);if(o<0){if(n)return;throw new Error("Rules manager: invalid rule name "+r)}this.__rules__[o].enabled=!0,t.push(r)},this),this.__cache__=null,t};kn.prototype.enableOnly=function(e,n){Array.isArray(e)||(e=[e]),this.__rules__.forEach(function(t){t.enabled=!1}),this.enable(e,n)};kn.prototype.disable=function(e,n){Array.isArray(e)||(e=[e]);let t=[];return e.forEach(function(r){let o=this.__find__(r);if(o<0){if(n)return;throw new Error("Rules manager: invalid rule name "+r)}this.__rules__[o].enabled=!1,t.push(r)},this),this.__cache__=null,t};kn.prototype.getRules=function(e){return this.__cache__===null&&this.__compile__(),this.__cache__[e]||[]};var er=kn;function jr(e,n,t){this.type=e,this.tag=n,this.attrs=null,this.map=null,this.nesting=t,this.level=0,this.children=null,this.content="",this.markup="",this.info="",this.meta=null,this.block=!1,this.hidden=!1}jr.prototype.attrIndex=function(n){if(!this.attrs)return-1;let t=this.attrs;for(let r=0,o=t.length;r<o;r++)if(t[r][0]===n)return r;return-1};jr.prototype.attrPush=function(n){this.attrs?this.attrs.push(n):this.attrs=[n]};jr.prototype.attrSet=function(n,t){let r=this.attrIndex(n),o=[n,t];r<0?this.attrPush(o):this.attrs[r]=o};jr.prototype.attrGet=function(n){let t=this.attrIndex(n),r=null;return t>=0&&(r=this.attrs[t][1]),r};jr.prototype.attrJoin=function(n,t){let r=this.attrIndex(n);r<0?this.attrPush([n,t]):this.attrs[r][1]=this.attrs[r][1]+" "+t};var ot=jr;function Mm(e,n,t){this.src=e,this.env=t,this.tokens=[],this.inlineMode=!1,this.md=n}Mm.prototype.Token=ot;var Pm=Mm;var xx=/\r\n?|\n/g,vx=/\0/g;function ql(e){let n;n=e.src.replace(xx,`
`),n=n.replace(vx,"\uFFFD"),e.src=n}function Hl(e){let n;e.inlineMode?(n=new e.Token("inline","",0),n.content=e.src,n.map=[0,1],n.children=[],e.tokens.push(n)):e.md.block.parse(e.src,e.md,e.env,e.tokens)}function Vl(e){let n=e.tokens;for(let t=0,r=n.length;t<r;t++){let o=n[t];o.type==="inline"&&e.md.inline.parse(o.content,e.md,e.env,o.children)}}function bx(e){return/^<a[>\s]/i.test(e)}function yx(e){return/^<\/a\s*>/i.test(e)}function $l(e){let n=e.tokens;if(e.md.options.linkify)for(let t=0,r=n.length;t<r;t++){if(n[t].type!=="inline"||!e.md.linkify.pretest(n[t].content))continue;let o=n[t].children,u=0;for(let a=o.length-1;a>=0;a--){let i=o[a];if(i.type==="link_close"){for(a--;o[a].level!==i.level&&o[a].type!=="link_open";)a--;continue}if(i.type==="html_inline"&&(bx(i.content)&&u>0&&u--,yx(i.content)&&u++),!(u>0)&&i.type==="text"&&e.md.linkify.test(i.content)){let s=i.content,l=e.md.linkify.match(s),f=[],m=i.level,g=0;l.length>0&&l[0].index===0&&a>0&&o[a-1].type==="text_special"&&(l=l.slice(1));for(let v=0;v<l.length;v++){let x=l[v].url,w=e.md.normalizeLink(x);if(!e.md.validateLink(w))continue;let C=l[v].text;l[v].schema?l[v].schema==="mailto:"&&!/^mailto:/i.test(C)?C=e.md.normalizeLinkText("mailto:"+C).replace(/^mailto:/,""):C=e.md.normalizeLinkText(C):C=e.md.normalizeLinkText("http://"+C).replace(/^http:\/\//,"");let h=l[v].index;if(h>g){let b=new e.Token("text","",0);b.content=s.slice(g,h),b.level=m,f.push(b)}let d=new e.Token("link_open","a",1);d.attrs=[["href",w]],d.level=m++,d.markup="linkify",d.info="auto",f.push(d);let c=new e.Token("text","",0);c.content=C,c.level=m,f.push(c);let p=new e.Token("link_close","a",-1);p.level=--m,p.markup="linkify",p.info="auto",f.push(p),g=l[v].lastIndex}if(g<s.length){let v=new e.Token("text","",0);v.content=s.slice(g),v.level=m,f.push(v)}n[t].children=o=Ll(o,a,f)}}}}var Lm=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,wx=/\((c|tm|r)\)/i,kx=/\((c|tm|r)\)/ig,Cx={c:"\xA9",r:"\xAE",tm:"\u2122"};function _x(e,n){return Cx[n.toLowerCase()]}function Sx(e){let n=0;for(let t=e.length-1;t>=0;t--){let r=e[t];r.type==="text"&&!n&&(r.content=r.content.replace(kx,_x)),r.type==="link_open"&&r.info==="auto"&&n--,r.type==="link_close"&&r.info==="auto"&&n++}}function Ex(e){let n=0;for(let t=e.length-1;t>=0;t--){let r=e[t];r.type==="text"&&!n&&Lm.test(r.content)&&(r.content=r.content.replace(/\+-/g,"\xB1").replace(/\.{2,}/g,"\u2026").replace(/([?!])…/g,"$1..").replace(/([?!]){4,}/g,"$1$1$1").replace(/,{2,}/g,",").replace(/(^|[^-])---(?=[^-]|$)/mg,"$1\u2014").replace(/(^|\s)--(?=\s|$)/mg,"$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg,"$1\u2013")),r.type==="link_open"&&r.info==="auto"&&n--,r.type==="link_close"&&r.info==="auto"&&n++}}function Wl(e){let n;if(e.md.options.typographer)for(n=e.tokens.length-1;n>=0;n--)e.tokens[n].type==="inline"&&(wx.test(e.tokens[n].content)&&Sx(e.tokens[n].children),Lm.test(e.tokens[n].content)&&Ex(e.tokens[n].children))}var Tx=/['"]/,zm=/['"]/g,Om="\u2019";function La(e,n,t){return e.slice(0,n)+t+e.slice(n+1)}function Ax(e,n){let t,r=[];for(let o=0;o<e.length;o++){let u=e[o],a=e[o].level;for(t=r.length-1;t>=0&&!(r[t].level<=a);t--);if(r.length=t+1,u.type!=="text")continue;let i=u.content,s=0,l=i.length;e:for(;s<l;){zm.lastIndex=s;let f=zm.exec(i);if(!f)break;let m=!0,g=!0;s=f.index+1;let v=f[0]==="'",x=32;if(f.index-1>=0)x=i.charCodeAt(f.index-1);else for(t=o-1;t>=0&&!(e[t].type==="softbreak"||e[t].type==="hardbreak");t--)if(e[t].content){x=e[t].content.charCodeAt(e[t].content.length-1);break}let w=32;if(s<l)w=i.charCodeAt(s);else for(t=o+1;t<e.length&&!(e[t].type==="softbreak"||e[t].type==="hardbreak");t++)if(e[t].content){w=e[t].content.charCodeAt(0);break}let C=Kt(x)||Yt(String.fromCharCode(x)),h=Kt(w)||Yt(String.fromCharCode(w)),d=Xt(x),c=Xt(w);if(c?m=!1:h&&(d||C||(m=!1)),d?g=!1:C&&(c||h||(g=!1)),w===34&&f[0]==='"'&&x>=48&&x<=57&&(g=m=!1),m&&g&&(m=C,g=h),!m&&!g){v&&(u.content=La(u.content,f.index,Om));continue}if(g)for(t=r.length-1;t>=0;t--){let p=r[t];if(r[t].level<a)break;if(p.single===v&&r[t].level===a){p=r[t];let b,y;v?(b=n.md.options.quotes[2],y=n.md.options.quotes[3]):(b=n.md.options.quotes[0],y=n.md.options.quotes[1]),u.content=La(u.content,f.index,y),e[p.token].content=La(e[p.token].content,p.pos,b),s+=y.length-1,p.token===o&&(s+=b.length-1),i=u.content,l=i.length,r.length=t;continue e}}m?r.push({token:o,pos:f.index,single:v,level:a}):g&&v&&(u.content=La(u.content,f.index,Om))}}}function Ql(e){if(e.md.options.typographer)for(let n=e.tokens.length-1;n>=0;n--)e.tokens[n].type!=="inline"||!Tx.test(e.tokens[n].content)||Ax(e.tokens[n].children,e)}function Zl(e){let n,t,r=e.tokens,o=r.length;for(let u=0;u<o;u++){if(r[u].type!=="inline")continue;let a=r[u].children,i=a.length;for(n=0;n<i;n++)a[n].type==="text_special"&&(a[n].type="text");for(n=t=0;n<i;n++)a[n].type==="text"&&n+1<i&&a[n+1].type==="text"?a[n+1].content=a[n].content+a[n+1].content:(n!==t&&(a[t]=a[n]),t++);n!==t&&(a.length=t)}}var Gl=[["normalize",ql],["block",Hl],["inline",Vl],["linkify",$l],["replacements",Wl],["smartquotes",Ql],["text_join",Zl]];function Xl(){this.ruler=new er;for(let e=0;e<Gl.length;e++)this.ruler.push(Gl[e][0],Gl[e][1])}Xl.prototype.process=function(e){let n=this.ruler.getRules("");for(let t=0,r=n.length;t<r;t++)n[t](e)};Xl.prototype.State=Pm;var Bm=Xl;function Ln(e,n,t,r){this.src=e,this.md=n,this.env=t,this.tokens=r,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType="root",this.level=0;let o=this.src;for(let u=0,a=0,i=0,s=0,l=o.length,f=!1;a<l;a++){let m=o.charCodeAt(a);if(!f)if(B(m)){i++,m===9?s+=4-s%4:s++;continue}else f=!0;(m===10||a===l-1)&&(m!==10&&a++,this.bMarks.push(u),this.eMarks.push(a),this.tShift.push(i),this.sCount.push(s),this.bsCount.push(0),f=!1,i=0,s=0,u=a+1)}this.bMarks.push(o.length),this.eMarks.push(o.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}Ln.prototype.push=function(e,n,t){let r=new ot(e,n,t);return r.block=!0,t<0&&this.level--,r.level=this.level,t>0&&this.level++,this.tokens.push(r),r};Ln.prototype.isEmpty=function(n){return this.bMarks[n]+this.tShift[n]>=this.eMarks[n]};Ln.prototype.skipEmptyLines=function(n){for(let t=this.lineMax;n<t&&!(this.bMarks[n]+this.tShift[n]<this.eMarks[n]);n++);return n};Ln.prototype.skipSpaces=function(n){for(let t=this.src.length;n<t;n++){let r=this.src.charCodeAt(n);if(!B(r))break}return n};Ln.prototype.skipSpacesBack=function(n,t){if(n<=t)return n;for(;n>t;)if(!B(this.src.charCodeAt(--n)))return n+1;return n};Ln.prototype.skipChars=function(n,t){for(let r=this.src.length;n<r&&this.src.charCodeAt(n)===t;n++);return n};Ln.prototype.skipCharsBack=function(n,t,r){if(n<=r)return n;for(;n>r;)if(t!==this.src.charCodeAt(--n))return n+1;return n};Ln.prototype.getLines=function(n,t,r,o){if(n>=t)return"";let u=new Array(t-n);for(let a=0,i=n;i<t;i++,a++){let s=0,l=this.bMarks[i],f=l,m;for(i+1<t||o?m=this.eMarks[i]+1:m=this.eMarks[i];f<m&&s<r;){let g=this.src.charCodeAt(f);if(B(g))g===9?s+=4-(s+this.bsCount[i])%4:s++;else if(f-l<this.tShift[i])s++;else break;f++}s>r?u[a]=new Array(s-r+1).join(" ")+this.src.slice(f,m):u[a]=this.src.slice(f,m)}return u.join("")};Ln.prototype.Token=ot;var Um=Ln;var Dx=65536;function Yl(e,n){let t=e.bMarks[n]+e.tShift[n],r=e.eMarks[n];return e.src.slice(t,r)}function jm(e){let n=[],t=e.length,r=0,o=e.charCodeAt(r),u=!1,a=0,i="";for(;r<t;)o===124&&(u?(i+=e.substring(a,r-1),a=r):(n.push(i+e.substring(a,r)),i="",a=r+1)),u=o===92,r++,o=e.charCodeAt(r);return n.push(i+e.substring(a)),n}function Kl(e,n,t,r){if(n+2>t)return!1;let o=n+1;if(e.sCount[o]<e.blkIndent||e.sCount[o]-e.blkIndent>=4)return!1;let u=e.bMarks[o]+e.tShift[o];if(u>=e.eMarks[o])return!1;let a=e.src.charCodeAt(u++);if(a!==124&&a!==45&&a!==58||u>=e.eMarks[o])return!1;let i=e.src.charCodeAt(u++);if(i!==124&&i!==45&&i!==58&&!B(i)||a===45&&B(i))return!1;for(;u<e.eMarks[o];){let p=e.src.charCodeAt(u);if(p!==124&&p!==45&&p!==58&&!B(p))return!1;u++}let s=Yl(e,n+1),l=s.split("|"),f=[];for(let p=0;p<l.length;p++){let b=l[p].trim();if(!b){if(p===0||p===l.length-1)continue;return!1}if(!/^:?-+:?$/.test(b))return!1;b.charCodeAt(b.length-1)===58?f.push(b.charCodeAt(0)===58?"center":"right"):b.charCodeAt(0)===58?f.push("left"):f.push("")}if(s=Yl(e,n).trim(),s.indexOf("|")===-1||e.sCount[n]-e.blkIndent>=4)return!1;l=jm(s),l.length&&l[0]===""&&l.shift(),l.length&&l[l.length-1]===""&&l.pop();let m=l.length;if(m===0||m!==f.length)return!1;if(r)return!0;let g=e.parentType;e.parentType="table";let v=e.md.block.ruler.getRules("blockquote"),x=e.push("table_open","table",1),w=[n,0];x.map=w;let C=e.push("thead_open","thead",1);C.map=[n,n+1];let h=e.push("tr_open","tr",1);h.map=[n,n+1];for(let p=0;p<l.length;p++){let b=e.push("th_open","th",1);f[p]&&(b.attrs=[["style","text-align:"+f[p]]]);let y=e.push("inline","",0);y.content=l[p].trim(),y.children=[],e.push("th_close","th",-1)}e.push("tr_close","tr",-1),e.push("thead_close","thead",-1);let d,c=0;for(o=n+2;o<t&&!(e.sCount[o]<e.blkIndent);o++){let p=!1;for(let y=0,k=v.length;y<k;y++)if(v[y](e,o,t,!0)){p=!0;break}if(p||(s=Yl(e,o).trim(),!s)||e.sCount[o]-e.blkIndent>=4||(l=jm(s),l.length&&l[0]===""&&l.shift(),l.length&&l[l.length-1]===""&&l.pop(),c+=m-l.length,c>Dx))break;if(o===n+2){let y=e.push("tbody_open","tbody",1);y.map=d=[n+2,0]}let b=e.push("tr_open","tr",1);b.map=[o,o+1];for(let y=0;y<m;y++){let k=e.push("td_open","td",1);f[y]&&(k.attrs=[["style","text-align:"+f[y]]]);let _=e.push("inline","",0);_.content=l[y]?l[y].trim():"",_.children=[],e.push("td_close","td",-1)}e.push("tr_close","tr",-1)}return d&&(e.push("tbody_close","tbody",-1),d[1]=o),e.push("table_close","table",-1),w[1]=o,e.parentType=g,e.line=o,!0}function Jl(e,n,t){if(e.sCount[n]-e.blkIndent<4)return!1;let r=n+1,o=r;for(;r<t;){if(e.isEmpty(r)){r++;continue}if(e.sCount[r]-e.blkIndent>=4){r++,o=r;continue}break}e.line=o;let u=e.push("code_block","code",0);return u.content=e.getLines(n,o,4+e.blkIndent,!1)+`
`,u.map=[n,e.line],!0}function ec(e,n,t,r){let o=e.bMarks[n]+e.tShift[n],u=e.eMarks[n];if(e.sCount[n]-e.blkIndent>=4||o+3>u)return!1;let a=e.src.charCodeAt(o);if(a!==126&&a!==96)return!1;let i=o;o=e.skipChars(o,a);let s=o-i;if(s<3)return!1;let l=e.src.slice(i,o),f=e.src.slice(o,u);if(a===96&&f.indexOf(String.fromCharCode(a))>=0)return!1;if(r)return!0;let m=n,g=!1;for(;m++,!(m>=t||(o=i=e.bMarks[m]+e.tShift[m],u=e.eMarks[m],o<u&&e.sCount[m]<e.blkIndent));)if(e.src.charCodeAt(o)===a&&!(e.sCount[m]-e.blkIndent>=4)&&(o=e.skipChars(o,a),!(o-i<s)&&(o=e.skipSpaces(o),!(o<u)))){g=!0;break}s=e.sCount[n],e.line=m+(g?1:0);let v=e.push("fence","code",0);return v.info=f,v.content=e.getLines(n+1,m,s,!0),v.markup=l,v.map=[n,e.line],!0}function nc(e,n,t,r){let o=e.bMarks[n]+e.tShift[n],u=e.eMarks[n],a=e.lineMax;if(e.sCount[n]-e.blkIndent>=4||e.src.charCodeAt(o)!==62)return!1;if(r)return!0;let i=[],s=[],l=[],f=[],m=e.md.block.ruler.getRules("blockquote"),g=e.parentType;e.parentType="blockquote";let v=!1,x;for(x=n;x<t;x++){let c=e.sCount[x]<e.blkIndent;if(o=e.bMarks[x]+e.tShift[x],u=e.eMarks[x],o>=u)break;if(e.src.charCodeAt(o++)===62&&!c){let b=e.sCount[x]+1,y,k;e.src.charCodeAt(o)===32?(o++,b++,k=!1,y=!0):e.src.charCodeAt(o)===9?(y=!0,(e.bsCount[x]+b)%4===3?(o++,b++,k=!1):k=!0):y=!1;let _=b;for(i.push(e.bMarks[x]),e.bMarks[x]=o;o<u;){let T=e.src.charCodeAt(o);if(B(T))T===9?_+=4-(_+e.bsCount[x]+(k?1:0))%4:_++;else break;o++}v=o>=u,s.push(e.bsCount[x]),e.bsCount[x]=e.sCount[x]+1+(y?1:0),l.push(e.sCount[x]),e.sCount[x]=_-b,f.push(e.tShift[x]),e.tShift[x]=o-e.bMarks[x];continue}if(v)break;let p=!1;for(let b=0,y=m.length;b<y;b++)if(m[b](e,x,t,!0)){p=!0;break}if(p){e.lineMax=x,e.blkIndent!==0&&(i.push(e.bMarks[x]),s.push(e.bsCount[x]),f.push(e.tShift[x]),l.push(e.sCount[x]),e.sCount[x]-=e.blkIndent);break}i.push(e.bMarks[x]),s.push(e.bsCount[x]),f.push(e.tShift[x]),l.push(e.sCount[x]),e.sCount[x]=-1}let w=e.blkIndent;e.blkIndent=0;let C=e.push("blockquote_open","blockquote",1);C.markup=">";let h=[n,0];C.map=h,e.md.block.tokenize(e,n,x);let d=e.push("blockquote_close","blockquote",-1);d.markup=">",e.lineMax=a,e.parentType=g,h[1]=e.line;for(let c=0;c<f.length;c++)e.bMarks[c+n]=i[c],e.tShift[c+n]=f[c],e.sCount[c+n]=l[c],e.bsCount[c+n]=s[c];return e.blkIndent=w,!0}function tc(e,n,t,r){let o=e.eMarks[n];if(e.sCount[n]-e.blkIndent>=4)return!1;let u=e.bMarks[n]+e.tShift[n],a=e.src.charCodeAt(u++);if(a!==42&&a!==45&&a!==95)return!1;let i=1;for(;u<o;){let l=e.src.charCodeAt(u++);if(l!==a&&!B(l))return!1;l===a&&i++}if(i<3)return!1;if(r)return!0;e.line=n+1;let s=e.push("hr","hr",0);return s.map=[n,e.line],s.markup=Array(i+1).join(String.fromCharCode(a)),!0}function qm(e,n){let t=e.eMarks[n],r=e.bMarks[n]+e.tShift[n],o=e.src.charCodeAt(r++);if(o!==42&&o!==45&&o!==43)return-1;if(r<t){let u=e.src.charCodeAt(r);if(!B(u))return-1}return r}function Hm(e,n){let t=e.bMarks[n]+e.tShift[n],r=e.eMarks[n],o=t;if(o+1>=r)return-1;let u=e.src.charCodeAt(o++);if(u<48||u>57)return-1;for(;;){if(o>=r)return-1;if(u=e.src.charCodeAt(o++),u>=48&&u<=57){if(o-t>=10)return-1;continue}if(u===41||u===46)break;return-1}return o<r&&(u=e.src.charCodeAt(o),!B(u))?-1:o}function Fx(e,n){let t=e.level+2;for(let r=n+2,o=e.tokens.length-2;r<o;r++)e.tokens[r].level===t&&e.tokens[r].type==="paragraph_open"&&(e.tokens[r+2].hidden=!0,e.tokens[r].hidden=!0,r+=2)}function rc(e,n,t,r){let o,u,a,i,s=n,l=!0;if(e.sCount[s]-e.blkIndent>=4||e.listIndent>=0&&e.sCount[s]-e.listIndent>=4&&e.sCount[s]<e.blkIndent)return!1;let f=!1;r&&e.parentType==="paragraph"&&e.sCount[s]>=e.blkIndent&&(f=!0);let m,g,v;if((v=Hm(e,s))>=0){if(m=!0,a=e.bMarks[s]+e.tShift[s],g=Number(e.src.slice(a,v-1)),f&&g!==1)return!1}else if((v=qm(e,s))>=0)m=!1;else return!1;if(f&&e.skipSpaces(v)>=e.eMarks[s])return!1;if(r)return!0;let x=e.src.charCodeAt(v-1),w=e.tokens.length;m?(i=e.push("ordered_list_open","ol",1),g!==1&&(i.attrs=[["start",g]])):i=e.push("bullet_list_open","ul",1);let C=[s,0];i.map=C,i.markup=String.fromCharCode(x);let h=!1,d=e.md.block.ruler.getRules("list"),c=e.parentType;for(e.parentType="list";s<t;){u=v,o=e.eMarks[s];let p=e.sCount[s]+v-(e.bMarks[s]+e.tShift[s]),b=p;for(;u<o;){let We=e.src.charCodeAt(u);if(We===9)b+=4-(b+e.bsCount[s])%4;else if(We===32)b++;else break;u++}let y=u,k;y>=o?k=1:k=b-p,k>4&&(k=1);let _=p+k;i=e.push("list_item_open","li",1),i.markup=String.fromCharCode(x);let T=[s,0];i.map=T,m&&(i.info=e.src.slice(a,v-1));let S=e.tight,N=e.tShift[s],P=e.sCount[s],tn=e.listIndent;if(e.listIndent=e.blkIndent,e.blkIndent=_,e.tight=!0,e.tShift[s]=y-e.bMarks[s],e.sCount[s]=b,y>=o&&e.isEmpty(s+1)?e.line=Math.min(e.line+2,t):e.md.block.tokenize(e,s,t,!0),(!e.tight||h)&&(l=!1),h=e.line-s>1&&e.isEmpty(e.line-1),e.blkIndent=e.listIndent,e.listIndent=tn,e.tShift[s]=N,e.sCount[s]=P,e.tight=S,i=e.push("list_item_close","li",-1),i.markup=String.fromCharCode(x),s=e.line,T[1]=s,s>=t||e.sCount[s]<e.blkIndent||e.sCount[s]-e.blkIndent>=4)break;let G=!1;for(let We=0,tr=d.length;We<tr;We++)if(d[We](e,s,t,!0)){G=!0;break}if(G)break;if(m){if(v=Hm(e,s),v<0)break;a=e.bMarks[s]+e.tShift[s]}else if(v=qm(e,s),v<0)break;if(x!==e.src.charCodeAt(v-1))break}return m?i=e.push("ordered_list_close","ol",-1):i=e.push("bullet_list_close","ul",-1),i.markup=String.fromCharCode(x),C[1]=s,e.line=s,e.parentType=c,l&&Fx(e,w),!0}function oc(e,n,t,r){let o=e.bMarks[n]+e.tShift[n],u=e.eMarks[n],a=n+1;if(e.sCount[n]-e.blkIndent>=4||e.src.charCodeAt(o)!==91)return!1;function i(d){let c=e.lineMax;if(d>=c||e.isEmpty(d))return null;let p=!1;if(e.sCount[d]-e.blkIndent>3&&(p=!0),e.sCount[d]<0&&(p=!0),!p){let k=e.md.block.ruler.getRules("reference"),_=e.parentType;e.parentType="reference";let T=!1;for(let S=0,N=k.length;S<N;S++)if(k[S](e,d,c,!0)){T=!0;break}if(e.parentType=_,T)return null}let b=e.bMarks[d]+e.tShift[d],y=e.eMarks[d];return e.src.slice(b,y+1)}let s=e.src.slice(o,u+1);u=s.length;let l=-1;for(o=1;o<u;o++){let d=s.charCodeAt(o);if(d===91)return!1;if(d===93){l=o;break}else if(d===10){let c=i(a);c!==null&&(s+=c,u=s.length,a++)}else if(d===92&&(o++,o<u&&s.charCodeAt(o)===10)){let c=i(a);c!==null&&(s+=c,u=s.length,a++)}}if(l<0||s.charCodeAt(l+1)!==58)return!1;for(o=l+2;o<u;o++){let d=s.charCodeAt(o);if(d===10){let c=i(a);c!==null&&(s+=c,u=s.length,a++)}else if(!B(d))break}let f=e.md.helpers.parseLinkDestination(s,o,u);if(!f.ok)return!1;let m=e.md.normalizeLink(f.str);if(!e.md.validateLink(m))return!1;o=f.pos;let g=o,v=a,x=o;for(;o<u;o++){let d=s.charCodeAt(o);if(d===10){let c=i(a);c!==null&&(s+=c,u=s.length,a++)}else if(!B(d))break}let w=e.md.helpers.parseLinkTitle(s,o,u);for(;w.can_continue;){let d=i(a);if(d===null)break;s+=d,o=u,u=s.length,a++,w=e.md.helpers.parseLinkTitle(s,o,u,w)}let C;for(o<u&&x!==o&&w.ok?(C=w.str,o=w.pos):(C="",o=g,a=v);o<u;){let d=s.charCodeAt(o);if(!B(d))break;o++}if(o<u&&s.charCodeAt(o)!==10&&C)for(C="",o=g,a=v;o<u;){let d=s.charCodeAt(o);if(!B(d))break;o++}if(o<u&&s.charCodeAt(o)!==10)return!1;let h=Jt(s.slice(1,l));return h?(r||(typeof e.env.references>"u"&&(e.env.references={}),typeof e.env.references[h]>"u"&&(e.env.references[h]={title:C,href:m}),e.line=a),!0):!1}var Vm=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"];var Nx="[a-zA-Z_:][a-zA-Z0-9:._-]*",Rx="[^\"'=<>`\\x00-\\x20]+",Ix="'[^']*'",Mx='"[^"]*"',Px="(?:"+Rx+"|"+Ix+"|"+Mx+")",Lx="(?:\\s+"+Nx+"(?:\\s*=\\s*"+Px+")?)",$m="<[A-Za-z][A-Za-z0-9\\-]*"+Lx+"*\\s*\\/?>",Wm="<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>",zx="<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->",Ox="<[?][\\s\\S]*?[?]>",Bx="<![A-Za-z][^>]*>",Ux="<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",Qm=new RegExp("^(?:"+$m+"|"+Wm+"|"+zx+"|"+Ox+"|"+Bx+"|"+Ux+")"),Zm=new RegExp("^(?:"+$m+"|"+Wm+")");var qr=[[/^<(script|pre|style|textarea)(?=(\s|>|$))/i,/<\/(script|pre|style|textarea)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[new RegExp("^</?("+Vm.join("|")+")(?=(\\s|/?>|$))","i"),/^$/,!0],[new RegExp(Zm.source+"\\s*$"),/^$/,!1]];function uc(e,n,t,r){let o=e.bMarks[n]+e.tShift[n],u=e.eMarks[n];if(e.sCount[n]-e.blkIndent>=4||!e.md.options.html||e.src.charCodeAt(o)!==60)return!1;let a=e.src.slice(o,u),i=0;for(;i<qr.length&&!qr[i][0].test(a);i++);if(i===qr.length)return!1;if(r)return qr[i][2];let s=n+1;if(!qr[i][1].test(a)){for(;s<t&&!(e.sCount[s]<e.blkIndent);s++)if(o=e.bMarks[s]+e.tShift[s],u=e.eMarks[s],a=e.src.slice(o,u),qr[i][1].test(a)){a.length!==0&&s++;break}}e.line=s;let l=e.push("html_block","",0);return l.map=[n,s],l.content=e.getLines(n,s,e.blkIndent,!0),!0}function ac(e,n,t,r){let o=e.bMarks[n]+e.tShift[n],u=e.eMarks[n];if(e.sCount[n]-e.blkIndent>=4)return!1;let a=e.src.charCodeAt(o);if(a!==35||o>=u)return!1;let i=1;for(a=e.src.charCodeAt(++o);a===35&&o<u&&i<=6;)i++,a=e.src.charCodeAt(++o);if(i>6||o<u&&!B(a))return!1;if(r)return!0;u=e.skipSpacesBack(u,o);let s=e.skipCharsBack(u,35,o);s>o&&B(e.src.charCodeAt(s-1))&&(u=s),e.line=n+1;let l=e.push("heading_open","h"+String(i),1);l.markup="########".slice(0,i),l.map=[n,e.line];let f=e.push("inline","",0);f.content=e.src.slice(o,u).trim(),f.map=[n,e.line],f.children=[];let m=e.push("heading_close","h"+String(i),-1);return m.markup="########".slice(0,i),!0}function ic(e,n,t){let r=e.md.block.ruler.getRules("paragraph");if(e.sCount[n]-e.blkIndent>=4)return!1;let o=e.parentType;e.parentType="paragraph";let u=0,a,i=n+1;for(;i<t&&!e.isEmpty(i);i++){if(e.sCount[i]-e.blkIndent>3)continue;if(e.sCount[i]>=e.blkIndent){let v=e.bMarks[i]+e.tShift[i],x=e.eMarks[i];if(v<x&&(a=e.src.charCodeAt(v),(a===45||a===61)&&(v=e.skipChars(v,a),v=e.skipSpaces(v),v>=x))){u=a===61?1:2;break}}if(e.sCount[i]<0)continue;let g=!1;for(let v=0,x=r.length;v<x;v++)if(r[v](e,i,t,!0)){g=!0;break}if(g)break}if(!u)return!1;let s=e.getLines(n,i,e.blkIndent,!1).trim();e.line=i+1;let l=e.push("heading_open","h"+String(u),1);l.markup=String.fromCharCode(a),l.map=[n,e.line];let f=e.push("inline","",0);f.content=s,f.map=[n,e.line-1],f.children=[];let m=e.push("heading_close","h"+String(u),-1);return m.markup=String.fromCharCode(a),e.parentType=o,!0}function sc(e,n,t){let r=e.md.block.ruler.getRules("paragraph"),o=e.parentType,u=n+1;for(e.parentType="paragraph";u<t&&!e.isEmpty(u);u++){if(e.sCount[u]-e.blkIndent>3||e.sCount[u]<0)continue;let l=!1;for(let f=0,m=r.length;f<m;f++)if(r[f](e,u,t,!0)){l=!0;break}if(l)break}let a=e.getLines(n,u,e.blkIndent,!1).trim();e.line=u;let i=e.push("paragraph_open","p",1);i.map=[n,e.line];let s=e.push("inline","",0);return s.content=a,s.map=[n,e.line],s.children=[],e.push("paragraph_close","p",-1),e.parentType=o,!0}var za=[["table",Kl,["paragraph","reference"]],["code",Jl],["fence",ec,["paragraph","reference","blockquote","list"]],["blockquote",nc,["paragraph","reference","blockquote","list"]],["hr",tc,["paragraph","reference","blockquote","list"]],["list",rc,["paragraph","reference","blockquote"]],["reference",oc],["html_block",uc,["paragraph","reference","blockquote"]],["heading",ac,["paragraph","reference","blockquote"]],["lheading",ic],["paragraph",sc]];function Oa(){this.ruler=new er;for(let e=0;e<za.length;e++)this.ruler.push(za[e][0],za[e][1],{alt:(za[e][2]||[]).slice()})}Oa.prototype.tokenize=function(e,n,t){let r=this.ruler.getRules(""),o=r.length,u=e.md.options.maxNesting,a=n,i=!1;for(;a<t&&(e.line=a=e.skipEmptyLines(a),!(a>=t||e.sCount[a]<e.blkIndent));){if(e.level>=u){e.line=t;break}let s=e.line,l=!1;for(let f=0;f<o;f++)if(l=r[f](e,a,t,!1),l){if(s>=e.line)throw new Error("block rule didn't increment state.line");break}if(!l)throw new Error("none of the block rules matched");e.tight=!i,e.isEmpty(e.line-1)&&(i=!0),a=e.line,a<t&&e.isEmpty(a)&&(i=!0,a++,e.line=a)}};Oa.prototype.parse=function(e,n,t,r){if(!e)return;let o=new this.State(e,n,t,r);this.tokenize(o,o.line,o.lineMax)};Oa.prototype.State=Um;var Gm=Oa;function Ho(e,n,t,r){this.src=e,this.env=t,this.md=n,this.tokens=r,this.tokens_meta=Array(r.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending="",this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[],this.backticks={},this.backticksScanned=!1,this.linkLevel=0}Ho.prototype.pushPending=function(){let e=new ot("text","",0);return e.content=this.pending,e.level=this.pendingLevel,this.tokens.push(e),this.pending="",e};Ho.prototype.push=function(e,n,t){this.pending&&this.pushPending();let r=new ot(e,n,t),o=null;return t<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),r.level=this.level,t>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],o={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(r),this.tokens_meta.push(o),r};Ho.prototype.scanDelims=function(e,n){let t=this.posMax,r=this.src.charCodeAt(e),o=e>0?this.src.charCodeAt(e-1):32,u=e;for(;u<t&&this.src.charCodeAt(u)===r;)u++;let a=u-e,i=u<t?this.src.charCodeAt(u):32,s=Kt(o)||Yt(String.fromCharCode(o)),l=Kt(i)||Yt(String.fromCharCode(i)),f=Xt(o),m=Xt(i),g=!m&&(!l||f||s),v=!f&&(!s||m||l);return{can_open:g&&(n||!v||s),can_close:v&&(n||!g||l),length:a}};Ho.prototype.Token=ot;var Xm=Ho;function jx(e){switch(e){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}function lc(e,n){let t=e.pos;for(;t<e.posMax&&!jx(e.src.charCodeAt(t));)t++;return t===e.pos?!1:(n||(e.pending+=e.src.slice(e.pos,t)),e.pos=t,!0)}var qx=/(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;function cc(e,n){if(!e.md.options.linkify||e.linkLevel>0)return!1;let t=e.pos,r=e.posMax;if(t+3>r||e.src.charCodeAt(t)!==58||e.src.charCodeAt(t+1)!==47||e.src.charCodeAt(t+2)!==47)return!1;let o=e.pending.match(qx);if(!o)return!1;let u=o[1],a=e.md.linkify.matchAtStart(e.src.slice(t-u.length));if(!a)return!1;let i=a.url;if(i.length<=u.length)return!1;i=i.replace(/\*+$/,"");let s=e.md.normalizeLink(i);if(!e.md.validateLink(s))return!1;if(!n){e.pending=e.pending.slice(0,-u.length);let l=e.push("link_open","a",1);l.attrs=[["href",s]],l.markup="linkify",l.info="auto";let f=e.push("text","",0);f.content=e.md.normalizeLinkText(i);let m=e.push("link_close","a",-1);m.markup="linkify",m.info="auto"}return e.pos+=i.length-u.length,!0}function dc(e,n){let t=e.pos;if(e.src.charCodeAt(t)!==10)return!1;let r=e.pending.length-1,o=e.posMax;if(!n)if(r>=0&&e.pending.charCodeAt(r)===32)if(r>=1&&e.pending.charCodeAt(r-1)===32){let u=r-1;for(;u>=1&&e.pending.charCodeAt(u-1)===32;)u--;e.pending=e.pending.slice(0,u),e.push("hardbreak","br",0)}else e.pending=e.pending.slice(0,-1),e.push("softbreak","br",0);else e.push("softbreak","br",0);for(t++;t<o&&B(e.src.charCodeAt(t));)t++;return e.pos=t,!0}var pc=[];for(let e=0;e<256;e++)pc.push(0);"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e){pc[e.charCodeAt(0)]=1});function fc(e,n){let t=e.pos,r=e.posMax;if(e.src.charCodeAt(t)!==92||(t++,t>=r))return!1;let o=e.src.charCodeAt(t);if(o===10){for(n||e.push("hardbreak","br",0),t++;t<r&&(o=e.src.charCodeAt(t),!!B(o));)t++;return e.pos=t,!0}let u=e.src[t];if(o>=55296&&o<=56319&&t+1<r){let i=e.src.charCodeAt(t+1);i>=56320&&i<=57343&&(u+=e.src[t+1],t++)}let a="\\"+u;if(!n){let i=e.push("text_special","",0);o<256&&pc[o]!==0?i.content=u:i.content=a,i.markup=a,i.info="escape"}return e.pos=t+1,!0}function mc(e,n){let t=e.pos;if(e.src.charCodeAt(t)!==96)return!1;let o=t;t++;let u=e.posMax;for(;t<u&&e.src.charCodeAt(t)===96;)t++;let a=e.src.slice(o,t),i=a.length;if(e.backticksScanned&&(e.backticks[i]||0)<=o)return n||(e.pending+=a),e.pos+=i,!0;let s=t,l;for(;(l=e.src.indexOf("`",s))!==-1;){for(s=l+1;s<u&&e.src.charCodeAt(s)===96;)s++;let f=s-l;if(f===i){if(!n){let m=e.push("code_inline","code",0);m.markup=a,m.content=e.src.slice(t,l).replace(/\n/g," ").replace(/^ (.+) $/,"$1")}return e.pos=s,!0}e.backticks[f]=l}return e.backticksScanned=!0,n||(e.pending+=a),e.pos+=i,!0}function Hx(e,n){let t=e.pos,r=e.src.charCodeAt(t);if(n||r!==126)return!1;let o=e.scanDelims(e.pos,!0),u=o.length,a=String.fromCharCode(r);if(u<2)return!1;let i;u%2&&(i=e.push("text","",0),i.content=a,u--);for(let s=0;s<u;s+=2)i=e.push("text","",0),i.content=a+a,e.delimiters.push({marker:r,length:0,token:e.tokens.length-1,end:-1,open:o.can_open,close:o.can_close});return e.pos+=o.length,!0}function Ym(e,n){let t,r=[],o=n.length;for(let u=0;u<o;u++){let a=n[u];if(a.marker!==126||a.end===-1)continue;let i=n[a.end];t=e.tokens[a.token],t.type="s_open",t.tag="s",t.nesting=1,t.markup="~~",t.content="",t=e.tokens[i.token],t.type="s_close",t.tag="s",t.nesting=-1,t.markup="~~",t.content="",e.tokens[i.token-1].type==="text"&&e.tokens[i.token-1].content==="~"&&r.push(i.token-1)}for(;r.length;){let u=r.pop(),a=u+1;for(;a<e.tokens.length&&e.tokens[a].type==="s_close";)a++;a--,u!==a&&(t=e.tokens[a],e.tokens[a]=e.tokens[u],e.tokens[u]=t)}}function Vx(e){let n=e.tokens_meta,t=e.tokens_meta.length;Ym(e,e.delimiters);for(let r=0;r<t;r++)n[r]&&n[r].delimiters&&Ym(e,n[r].delimiters)}var hc={tokenize:Hx,postProcess:Vx};function $x(e,n){let t=e.pos,r=e.src.charCodeAt(t);if(n||r!==95&&r!==42)return!1;let o=e.scanDelims(e.pos,r===42);for(let u=0;u<o.length;u++){let a=e.push("text","",0);a.content=String.fromCharCode(r),e.delimiters.push({marker:r,length:o.length,token:e.tokens.length-1,end:-1,open:o.can_open,close:o.can_close})}return e.pos+=o.length,!0}function Km(e,n){let t=n.length;for(let r=t-1;r>=0;r--){let o=n[r];if(o.marker!==95&&o.marker!==42||o.end===-1)continue;let u=n[o.end],a=r>0&&n[r-1].end===o.end+1&&n[r-1].marker===o.marker&&n[r-1].token===o.token-1&&n[o.end+1].token===u.token+1,i=String.fromCharCode(o.marker),s=e.tokens[o.token];s.type=a?"strong_open":"em_open",s.tag=a?"strong":"em",s.nesting=1,s.markup=a?i+i:i,s.content="";let l=e.tokens[u.token];l.type=a?"strong_close":"em_close",l.tag=a?"strong":"em",l.nesting=-1,l.markup=a?i+i:i,l.content="",a&&(e.tokens[n[r-1].token].content="",e.tokens[n[o.end+1].token].content="",r--)}}function Wx(e){let n=e.tokens_meta,t=e.tokens_meta.length;Km(e,e.delimiters);for(let r=0;r<t;r++)n[r]&&n[r].delimiters&&Km(e,n[r].delimiters)}var gc={tokenize:$x,postProcess:Wx};function xc(e,n){let t,r,o,u,a="",i="",s=e.pos,l=!0;if(e.src.charCodeAt(e.pos)!==91)return!1;let f=e.pos,m=e.posMax,g=e.pos+1,v=e.md.helpers.parseLinkLabel(e,e.pos,!0);if(v<0)return!1;let x=v+1;if(x<m&&e.src.charCodeAt(x)===40){for(l=!1,x++;x<m&&(t=e.src.charCodeAt(x),!(!B(t)&&t!==10));x++);if(x>=m)return!1;if(s=x,o=e.md.helpers.parseLinkDestination(e.src,x,e.posMax),o.ok){for(a=e.md.normalizeLink(o.str),e.md.validateLink(a)?x=o.pos:a="",s=x;x<m&&(t=e.src.charCodeAt(x),!(!B(t)&&t!==10));x++);if(o=e.md.helpers.parseLinkTitle(e.src,x,e.posMax),x<m&&s!==x&&o.ok)for(i=o.str,x=o.pos;x<m&&(t=e.src.charCodeAt(x),!(!B(t)&&t!==10));x++);}(x>=m||e.src.charCodeAt(x)!==41)&&(l=!0),x++}if(l){if(typeof e.env.references>"u")return!1;if(x<m&&e.src.charCodeAt(x)===91?(s=x+1,x=e.md.helpers.parseLinkLabel(e,x),x>=0?r=e.src.slice(s,x++):x=v+1):x=v+1,r||(r=e.src.slice(g,v)),u=e.env.references[Jt(r)],!u)return e.pos=f,!1;a=u.href,i=u.title}if(!n){e.pos=g,e.posMax=v;let w=e.push("link_open","a",1),C=[["href",a]];w.attrs=C,i&&C.push(["title",i]),e.linkLevel++,e.md.inline.tokenize(e),e.linkLevel--,e.push("link_close","a",-1)}return e.pos=x,e.posMax=m,!0}function vc(e,n){let t,r,o,u,a,i,s,l,f="",m=e.pos,g=e.posMax;if(e.src.charCodeAt(e.pos)!==33||e.src.charCodeAt(e.pos+1)!==91)return!1;let v=e.pos+2,x=e.md.helpers.parseLinkLabel(e,e.pos+1,!1);if(x<0)return!1;if(u=x+1,u<g&&e.src.charCodeAt(u)===40){for(u++;u<g&&(t=e.src.charCodeAt(u),!(!B(t)&&t!==10));u++);if(u>=g)return!1;for(l=u,i=e.md.helpers.parseLinkDestination(e.src,u,e.posMax),i.ok&&(f=e.md.normalizeLink(i.str),e.md.validateLink(f)?u=i.pos:f=""),l=u;u<g&&(t=e.src.charCodeAt(u),!(!B(t)&&t!==10));u++);if(i=e.md.helpers.parseLinkTitle(e.src,u,e.posMax),u<g&&l!==u&&i.ok)for(s=i.str,u=i.pos;u<g&&(t=e.src.charCodeAt(u),!(!B(t)&&t!==10));u++);else s="";if(u>=g||e.src.charCodeAt(u)!==41)return e.pos=m,!1;u++}else{if(typeof e.env.references>"u")return!1;if(u<g&&e.src.charCodeAt(u)===91?(l=u+1,u=e.md.helpers.parseLinkLabel(e,u),u>=0?o=e.src.slice(l,u++):u=x+1):u=x+1,o||(o=e.src.slice(v,x)),a=e.env.references[Jt(o)],!a)return e.pos=m,!1;f=a.href,s=a.title}if(!n){r=e.src.slice(v,x);let w=[];e.md.inline.parse(r,e.md,e.env,w);let C=e.push("image","img",0),h=[["src",f],["alt",""]];C.attrs=h,C.children=w,C.content=r,s&&h.push(["title",s])}return e.pos=u,e.posMax=g,!0}var Qx=/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/,Zx=/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;function bc(e,n){let t=e.pos;if(e.src.charCodeAt(t)!==60)return!1;let r=e.pos,o=e.posMax;for(;;){if(++t>=o)return!1;let a=e.src.charCodeAt(t);if(a===60)return!1;if(a===62)break}let u=e.src.slice(r+1,t);if(Zx.test(u)){let a=e.md.normalizeLink(u);if(!e.md.validateLink(a))return!1;if(!n){let i=e.push("link_open","a",1);i.attrs=[["href",a]],i.markup="autolink",i.info="auto";let s=e.push("text","",0);s.content=e.md.normalizeLinkText(u);let l=e.push("link_close","a",-1);l.markup="autolink",l.info="auto"}return e.pos+=u.length+2,!0}if(Qx.test(u)){let a=e.md.normalizeLink("mailto:"+u);if(!e.md.validateLink(a))return!1;if(!n){let i=e.push("link_open","a",1);i.attrs=[["href",a]],i.markup="autolink",i.info="auto";let s=e.push("text","",0);s.content=e.md.normalizeLinkText(u);let l=e.push("link_close","a",-1);l.markup="autolink",l.info="auto"}return e.pos+=u.length+2,!0}return!1}function Gx(e){return/^<a[>\s]/i.test(e)}function Xx(e){return/^<\/a\s*>/i.test(e)}function Yx(e){let n=e|32;return n>=97&&n<=122}function yc(e,n){if(!e.md.options.html)return!1;let t=e.posMax,r=e.pos;if(e.src.charCodeAt(r)!==60||r+2>=t)return!1;let o=e.src.charCodeAt(r+1);if(o!==33&&o!==63&&o!==47&&!Yx(o))return!1;let u=e.src.slice(r).match(Qm);if(!u)return!1;if(!n){let a=e.push("html_inline","",0);a.content=u[0],Gx(a.content)&&e.linkLevel++,Xx(a.content)&&e.linkLevel--}return e.pos+=u[0].length,!0}var Kx=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,Jx=/^&([a-z][a-z0-9]{1,31});/i;function wc(e,n){let t=e.pos,r=e.posMax;if(e.src.charCodeAt(t)!==38||t+1>=r)return!1;if(e.src.charCodeAt(t+1)===35){let u=e.src.slice(t).match(Kx);if(u){if(!n){let a=u[1][0].toLowerCase()==="x"?parseInt(u[1].slice(1),16):parseInt(u[1],10),i=e.push("text_special","",0);i.content=Pa(a)?qo(a):qo(65533),i.markup=u[0],i.info="entity"}return e.pos+=u[0].length,!0}}else{let u=e.src.slice(t).match(Jx);if(u){let a=Dt(u[0]);if(a!==u[0]){if(!n){let i=e.push("text_special","",0);i.content=a,i.markup=u[0],i.info="entity"}return e.pos+=u[0].length,!0}}}return!1}function Jm(e){let n={},t=e.length;if(!t)return;let r=0,o=-2,u=[];for(let a=0;a<t;a++){let i=e[a];if(u.push(0),(e[r].marker!==i.marker||o!==i.token-1)&&(r=a),o=i.token,i.length=i.length||0,!i.close)continue;n.hasOwnProperty(i.marker)||(n[i.marker]=[-1,-1,-1,-1,-1,-1]);let s=n[i.marker][(i.open?3:0)+i.length%3],l=r-u[r]-1,f=l;for(;l>s;l-=u[l]+1){let m=e[l];if(m.marker===i.marker&&m.open&&m.end<0){let g=!1;if((m.close||i.open)&&(m.length+i.length)%3===0&&(m.length%3!==0||i.length%3!==0)&&(g=!0),!g){let v=l>0&&!e[l-1].open?u[l-1]+1:0;u[a]=a-l+v,u[l]=v,i.open=!1,m.end=a,m.close=!1,f=-1,o=-2;break}}}f!==-1&&(n[i.marker][(i.open?3:0)+(i.length||0)%3]=f)}}function kc(e){let n=e.tokens_meta,t=e.tokens_meta.length;Jm(e.delimiters);for(let r=0;r<t;r++)n[r]&&n[r].delimiters&&Jm(n[r].delimiters)}function Cc(e){let n,t,r=0,o=e.tokens,u=e.tokens.length;for(n=t=0;n<u;n++)o[n].nesting<0&&r--,o[n].level=r,o[n].nesting>0&&r++,o[n].type==="text"&&n+1<u&&o[n+1].type==="text"?o[n+1].content=o[n].content+o[n+1].content:(n!==t&&(o[t]=o[n]),t++);n!==t&&(o.length=t)}var _c=[["text",lc],["linkify",cc],["newline",dc],["escape",fc],["backticks",mc],["strikethrough",hc.tokenize],["emphasis",gc.tokenize],["link",xc],["image",vc],["autolink",bc],["html_inline",yc],["entity",wc]],Sc=[["balance_pairs",kc],["strikethrough",hc.postProcess],["emphasis",gc.postProcess],["fragments_join",Cc]];function Vo(){this.ruler=new er;for(let e=0;e<_c.length;e++)this.ruler.push(_c[e][0],_c[e][1]);this.ruler2=new er;for(let e=0;e<Sc.length;e++)this.ruler2.push(Sc[e][0],Sc[e][1])}Vo.prototype.skipToken=function(e){let n=e.pos,t=this.ruler.getRules(""),r=t.length,o=e.md.options.maxNesting,u=e.cache;if(typeof u[n]<"u"){e.pos=u[n];return}let a=!1;if(e.level<o){for(let i=0;i<r;i++)if(e.level++,a=t[i](e,!0),e.level--,a){if(n>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}else e.pos=e.posMax;a||e.pos++,u[n]=e.pos};Vo.prototype.tokenize=function(e){let n=this.ruler.getRules(""),t=n.length,r=e.posMax,o=e.md.options.maxNesting;for(;e.pos<r;){let u=e.pos,a=!1;if(e.level<o){for(let i=0;i<t;i++)if(a=n[i](e,!1),a){if(u>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}if(a){if(e.pos>=r)break;continue}e.pending+=e.src[e.pos++]}e.pending&&e.pushPending()};Vo.prototype.parse=function(e,n,t,r){let o=new this.State(e,n,t,r);this.tokenize(o);let u=this.ruler2.getRules(""),a=u.length;for(let i=0;i<a;i++)u[i](o)};Vo.prototype.State=Xm;var e1=Vo;function n1(e){let n={};e=e||{},n.src_Any=Aa.source,n.src_Cc=Da.source,n.src_Z=Na.source,n.src_P=Or.source,n.src_ZPCc=[n.src_Z,n.src_P,n.src_Cc].join("|"),n.src_ZCc=[n.src_Z,n.src_Cc].join("|");let t="[><\uFF5C]";return n.src_pseudo_letter="(?:(?!"+t+"|"+n.src_ZPCc+")"+n.src_Any+")",n.src_ip4="(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",n.src_auth="(?:(?:(?!"+n.src_ZCc+"|[@/\\[\\]()]).)+@)?",n.src_port="(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?",n.src_host_terminator="(?=$|"+t+"|"+n.src_ZPCc+")(?!"+(e["---"]?"-(?!--)|":"-|")+"_|:\\d|\\.-|\\.(?!$|"+n.src_ZPCc+"))",n.src_path="(?:[/?#](?:(?!"+n.src_ZCc+"|"+t+`|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!`+n.src_ZCc+"|\\]).)*\\]|\\((?:(?!"+n.src_ZCc+"|[)]).)*\\)|\\{(?:(?!"+n.src_ZCc+'|[}]).)*\\}|\\"(?:(?!'+n.src_ZCc+`|["]).)+\\"|\\'(?:(?!`+n.src_ZCc+"|[']).)+\\'|\\'(?="+n.src_pseudo_letter+"|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!"+n.src_ZCc+"|[.]|$)|"+(e["---"]?"\\-(?!--(?:[^-]|$))(?:-*)|":"\\-+|")+",(?!"+n.src_ZCc+"|$)|;(?!"+n.src_ZCc+"|$)|\\!+(?!"+n.src_ZCc+"|[!]|$)|\\?(?!"+n.src_ZCc+"|[?]|$))+|\\/)?",n.src_email_name='[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*',n.src_xn="xn--[a-z0-9\\-]{1,59}",n.src_domain_root="(?:"+n.src_xn+"|"+n.src_pseudo_letter+"{1,63})",n.src_domain="(?:"+n.src_xn+"|(?:"+n.src_pseudo_letter+")|(?:"+n.src_pseudo_letter+"(?:-|"+n.src_pseudo_letter+"){0,61}"+n.src_pseudo_letter+"))",n.src_host="(?:(?:(?:(?:"+n.src_domain+")\\.)*"+n.src_domain+"))",n.tpl_host_fuzzy="(?:"+n.src_ip4+"|(?:(?:(?:"+n.src_domain+")\\.)+(?:%TLDS%)))",n.tpl_host_no_ip_fuzzy="(?:(?:(?:"+n.src_domain+")\\.)+(?:%TLDS%))",n.src_host_strict=n.src_host+n.src_host_terminator,n.tpl_host_fuzzy_strict=n.tpl_host_fuzzy+n.src_host_terminator,n.src_host_port_strict=n.src_host+n.src_port+n.src_host_terminator,n.tpl_host_port_fuzzy_strict=n.tpl_host_fuzzy+n.src_port+n.src_host_terminator,n.tpl_host_port_no_ip_fuzzy_strict=n.tpl_host_no_ip_fuzzy+n.src_port+n.src_host_terminator,n.tpl_host_fuzzy_test="localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:"+n.src_ZPCc+"|>|$))",n.tpl_email_fuzzy="(^|"+t+'|"|\\(|'+n.src_ZCc+")("+n.src_email_name+"@"+n.tpl_host_fuzzy_strict+")",n.tpl_link_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|\uFF5C]|"+n.src_ZPCc+"))((?![$+<=>^`|\uFF5C])"+n.tpl_host_port_fuzzy_strict+n.src_path+")",n.tpl_link_no_ip_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|\uFF5C]|"+n.src_ZPCc+"))((?![$+<=>^`|\uFF5C])"+n.tpl_host_port_no_ip_fuzzy_strict+n.src_path+")",n}function Ec(e){return Array.prototype.slice.call(arguments,1).forEach(function(t){t&&Object.keys(t).forEach(function(r){e[r]=t[r]})}),e}function Ua(e){return Object.prototype.toString.call(e)}function ev(e){return Ua(e)==="[object String]"}function nv(e){return Ua(e)==="[object Object]"}function tv(e){return Ua(e)==="[object RegExp]"}function t1(e){return Ua(e)==="[object Function]"}function rv(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}var o1={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};function ov(e){return Object.keys(e||{}).reduce(function(n,t){return n||o1.hasOwnProperty(t)},!1)}var uv={"http:":{validate:function(e,n,t){let r=e.slice(n);return t.re.http||(t.re.http=new RegExp("^\\/\\/"+t.re.src_auth+t.re.src_host_port_strict+t.re.src_path,"i")),t.re.http.test(r)?r.match(t.re.http)[0].length:0}},"https:":"http:","ftp:":"http:","//":{validate:function(e,n,t){let r=e.slice(n);return t.re.no_http||(t.re.no_http=new RegExp("^"+t.re.src_auth+"(?:localhost|(?:(?:"+t.re.src_domain+")\\.)+"+t.re.src_domain_root+")"+t.re.src_port+t.re.src_host_terminator+t.re.src_path,"i")),t.re.no_http.test(r)?n>=3&&e[n-3]===":"||n>=3&&e[n-3]==="/"?0:r.match(t.re.no_http)[0].length:0}},"mailto:":{validate:function(e,n,t){let r=e.slice(n);return t.re.mailto||(t.re.mailto=new RegExp("^"+t.re.src_email_name+"@"+t.re.src_host_strict,"i")),t.re.mailto.test(r)?r.match(t.re.mailto)[0].length:0}}},av="a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]",iv="biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444".split("|");function sv(e){e.__index__=-1,e.__text_cache__=""}function lv(e){return function(n,t){let r=n.slice(t);return e.test(r)?r.match(e)[0].length:0}}function r1(){return function(e,n){n.normalize(e)}}function Ba(e){let n=e.re=n1(e.__opts__),t=e.__tlds__.slice();e.onCompile(),e.__tlds_replaced__||t.push(av),t.push(n.src_xn),n.src_tlds=t.join("|");function r(i){return i.replace("%TLDS%",n.src_tlds)}n.email_fuzzy=RegExp(r(n.tpl_email_fuzzy),"i"),n.link_fuzzy=RegExp(r(n.tpl_link_fuzzy),"i"),n.link_no_ip_fuzzy=RegExp(r(n.tpl_link_no_ip_fuzzy),"i"),n.host_fuzzy_test=RegExp(r(n.tpl_host_fuzzy_test),"i");let o=[];e.__compiled__={};function u(i,s){throw new Error('(LinkifyIt) Invalid schema "'+i+'": '+s)}Object.keys(e.__schemas__).forEach(function(i){let s=e.__schemas__[i];if(s===null)return;let l={validate:null,link:null};if(e.__compiled__[i]=l,nv(s)){tv(s.validate)?l.validate=lv(s.validate):t1(s.validate)?l.validate=s.validate:u(i,s),t1(s.normalize)?l.normalize=s.normalize:s.normalize?u(i,s):l.normalize=r1();return}if(ev(s)){o.push(i);return}u(i,s)}),o.forEach(function(i){e.__compiled__[e.__schemas__[i]]&&(e.__compiled__[i].validate=e.__compiled__[e.__schemas__[i]].validate,e.__compiled__[i].normalize=e.__compiled__[e.__schemas__[i]].normalize)}),e.__compiled__[""]={validate:null,normalize:r1()};let a=Object.keys(e.__compiled__).filter(function(i){return i.length>0&&e.__compiled__[i]}).map(rv).join("|");e.re.schema_test=RegExp("(^|(?!_)(?:[><\uFF5C]|"+n.src_ZPCc+"))("+a+")","i"),e.re.schema_search=RegExp("(^|(?!_)(?:[><\uFF5C]|"+n.src_ZPCc+"))("+a+")","ig"),e.re.schema_at_start=RegExp("^"+e.re.schema_search.source,"i"),e.re.pretest=RegExp("("+e.re.schema_test.source+")|("+e.re.host_fuzzy_test.source+")|@","i"),sv(e)}function cv(e,n){let t=e.__index__,r=e.__last_index__,o=e.__text_cache__.slice(t,r);this.schema=e.__schema__.toLowerCase(),this.index=t+n,this.lastIndex=r+n,this.raw=o,this.text=o,this.url=o}function Tc(e,n){let t=new cv(e,n);return e.__compiled__[t.schema].normalize(t,e),t}function nn(e,n){if(!(this instanceof nn))return new nn(e,n);n||ov(e)&&(n=e,e={}),this.__opts__=Ec({},o1,n),this.__index__=-1,this.__last_index__=-1,this.__schema__="",this.__text_cache__="",this.__schemas__=Ec({},uv,e),this.__compiled__={},this.__tlds__=iv,this.__tlds_replaced__=!1,this.re={},Ba(this)}nn.prototype.add=function(n,t){return this.__schemas__[n]=t,Ba(this),this};nn.prototype.set=function(n){return this.__opts__=Ec(this.__opts__,n),this};nn.prototype.test=function(n){if(this.__text_cache__=n,this.__index__=-1,!n.length)return!1;let t,r,o,u,a,i,s,l,f;if(this.re.schema_test.test(n)){for(s=this.re.schema_search,s.lastIndex=0;(t=s.exec(n))!==null;)if(u=this.testSchemaAt(n,t[2],s.lastIndex),u){this.__schema__=t[2],this.__index__=t.index+t[1].length,this.__last_index__=t.index+t[0].length+u;break}}return this.__opts__.fuzzyLink&&this.__compiled__["http:"]&&(l=n.search(this.re.host_fuzzy_test),l>=0&&(this.__index__<0||l<this.__index__)&&(r=n.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy))!==null&&(a=r.index+r[1].length,(this.__index__<0||a<this.__index__)&&(this.__schema__="",this.__index__=a,this.__last_index__=r.index+r[0].length))),this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"]&&(f=n.indexOf("@"),f>=0&&(o=n.match(this.re.email_fuzzy))!==null&&(a=o.index+o[1].length,i=o.index+o[0].length,(this.__index__<0||a<this.__index__||a===this.__index__&&i>this.__last_index__)&&(this.__schema__="mailto:",this.__index__=a,this.__last_index__=i))),this.__index__>=0};nn.prototype.pretest=function(n){return this.re.pretest.test(n)};nn.prototype.testSchemaAt=function(n,t,r){return this.__compiled__[t.toLowerCase()]?this.__compiled__[t.toLowerCase()].validate(n,r,this):0};nn.prototype.match=function(n){let t=[],r=0;this.__index__>=0&&this.__text_cache__===n&&(t.push(Tc(this,r)),r=this.__last_index__);let o=r?n.slice(r):n;for(;this.test(o);)t.push(Tc(this,r)),o=o.slice(this.__last_index__),r+=this.__last_index__;return t.length?t:null};nn.prototype.matchAtStart=function(n){if(this.__text_cache__=n,this.__index__=-1,!n.length)return null;let t=this.re.schema_at_start.exec(n);if(!t)return null;let r=this.testSchemaAt(n,t[2],t[0].length);return r?(this.__schema__=t[2],this.__index__=t.index+t[1].length,this.__last_index__=t.index+t[0].length+r,Tc(this,0)):null};nn.prototype.tlds=function(n,t){return n=Array.isArray(n)?n:[n],t?(this.__tlds__=this.__tlds__.concat(n).sort().filter(function(r,o,u){return r!==u[o-1]}).reverse(),Ba(this),this):(this.__tlds__=n.slice(),this.__tlds_replaced__=!0,Ba(this),this)};nn.prototype.normalize=function(n){n.schema||(n.url="http://"+n.url),n.schema==="mailto:"&&!/^mailto:/i.test(n.url)&&(n.url="mailto:"+n.url)};nn.prototype.onCompile=function(){};var u1=nn;var i1="-",dv=/^xn--/,pv=/[^\0-\x7F]/,fv=/[\x2E\u3002\uFF0E\uFF61]/g,mv={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},Ac=35,zn=Math.floor,Dc=String.fromCharCode;function Ft(e){throw new RangeError(mv[e])}function hv(e,n){let t=[],r=e.length;for(;r--;)t[r]=n(e[r]);return t}function s1(e,n){let t=e.split("@"),r="";t.length>1&&(r=t[0]+"@",e=t[1]),e=e.replace(fv,".");let o=e.split("."),u=hv(o,n).join(".");return r+u}function l1(e){let n=[],t=0,r=e.length;for(;t<r;){let o=e.charCodeAt(t++);if(o>=55296&&o<=56319&&t<r){let u=e.charCodeAt(t++);(u&64512)==56320?n.push(((o&1023)<<10)+(u&1023)+65536):(n.push(o),t--)}else n.push(o)}return n}var gv=e=>String.fromCodePoint(...e),xv=function(e){return e>=48&&e<58?26+(e-48):e>=65&&e<91?e-65:e>=97&&e<123?e-97:36},a1=function(e,n){return e+22+75*(e<26)-((n!=0)<<5)},c1=function(e,n,t){let r=0;for(e=t?zn(e/700):e>>1,e+=zn(e/n);e>Ac*26>>1;r+=36)e=zn(e/Ac);return zn(r+(Ac+1)*e/(e+38))},d1=function(e){let n=[],t=e.length,r=0,o=128,u=72,a=e.lastIndexOf(i1);a<0&&(a=0);for(let i=0;i<a;++i)e.charCodeAt(i)>=128&&Ft("not-basic"),n.push(e.charCodeAt(i));for(let i=a>0?a+1:0;i<t;){let s=r;for(let f=1,m=36;;m+=36){i>=t&&Ft("invalid-input");let g=xv(e.charCodeAt(i++));g>=36&&Ft("invalid-input"),g>zn((2147483647-r)/f)&&Ft("overflow"),r+=g*f;let v=m<=u?1:m>=u+26?26:m-u;if(g<v)break;let x=36-v;f>zn(2147483647/x)&&Ft("overflow"),f*=x}let l=n.length+1;u=c1(r-s,l,s==0),zn(r/l)>2147483647-o&&Ft("overflow"),o+=zn(r/l),r%=l,n.splice(r++,0,o)}return String.fromCodePoint(...n)},p1=function(e){let n=[];e=l1(e);let t=e.length,r=128,o=0,u=72;for(let s of e)s<128&&n.push(Dc(s));let a=n.length,i=a;for(a&&n.push(i1);i<t;){let s=2147483647;for(let f of e)f>=r&&f<s&&(s=f);let l=i+1;s-r>zn((2147483647-o)/l)&&Ft("overflow"),o+=(s-r)*l,r=s;for(let f of e)if(f<r&&++o>2147483647&&Ft("overflow"),f===r){let m=o;for(let g=36;;g+=36){let v=g<=u?1:g>=u+26?26:g-u;if(m<v)break;let x=m-v,w=36-v;n.push(Dc(a1(v+x%w,0))),m=zn(x/w)}n.push(Dc(a1(m,0))),u=c1(o,l,i===a),o=0,++i}++o,++r}return n.join("")},vv=function(e){return s1(e,function(n){return dv.test(n)?d1(n.slice(4).toLowerCase()):n})},bv=function(e){return s1(e,function(n){return pv.test(n)?"xn--"+p1(n):n})},yv={version:"2.3.1",ucs2:{decode:l1,encode:gv},decode:d1,encode:p1,toASCII:bv,toUnicode:vv};var Fc=yv;var f1={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201C\u201D\u2018\u2019",highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}};var m1={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201C\u201D\u2018\u2019",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["paragraph"]},inline:{rules:["text"],rules2:["balance_pairs","fragments_join"]}}};var h1={options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201C\u201D\u2018\u2019",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["blockquote","code","fence","heading","hr","html_block","lheading","list","reference","paragraph"]},inline:{rules:["autolink","backticks","emphasis","entity","escape","html_inline","image","link","newline","text"],rules2:["balance_pairs","emphasis","fragments_join"]}}};var wv={default:f1,zero:m1,commonmark:h1},kv=/^(vbscript|javascript|file|data):/,Cv=/^data:image\/(gif|png|jpeg|webp);/;function _v(e){let n=e.trim().toLowerCase();return kv.test(n)?Cv.test(n):!0}var g1=["http:","https:","mailto:"];function Sv(e){let n=jo(e,!0);if(n.hostname&&(!n.protocol||g1.indexOf(n.protocol)>=0))try{n.hostname=Fc.toASCII(n.hostname)}catch{}return Sa(zr(n))}function Ev(e){let n=jo(e,!0);if(n.hostname&&(!n.protocol||g1.indexOf(n.protocol)>=0))try{n.hostname=Fc.toUnicode(n.hostname)}catch{}return Uo(zr(n),Uo.defaultChars+"%")}function dn(e,n){if(!(this instanceof dn))return new dn(e,n);n||Ma(e)||(n=e||{},e="default"),this.inline=new e1,this.block=new Gm,this.core=new Bm,this.renderer=new Im,this.linkify=new u1,this.validateLink=_v,this.normalizeLink=Sv,this.normalizeLinkText=Ev,this.utils=zl,this.helpers=Br({},jl),this.options={},this.configure(e),n&&this.set(n)}dn.prototype.set=function(e){return Br(this.options,e),this};dn.prototype.configure=function(e){let n=this;if(Ma(e)){let t=e;if(e=wv[t],!e)throw new Error('Wrong `markdown-it` preset "'+t+'", check name')}if(!e)throw new Error("Wrong `markdown-it` preset, can't be empty");return e.options&&n.set(e.options),e.components&&Object.keys(e.components).forEach(function(t){e.components[t].rules&&n[t].ruler.enableOnly(e.components[t].rules),e.components[t].rules2&&n[t].ruler2.enableOnly(e.components[t].rules2)}),this};dn.prototype.enable=function(e,n){let t=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(o){t=t.concat(this[o].ruler.enable(e,!0))},this),t=t.concat(this.inline.ruler2.enable(e,!0));let r=e.filter(function(o){return t.indexOf(o)<0});if(r.length&&!n)throw new Error("MarkdownIt. Failed to enable unknown rule(s): "+r);return this};dn.prototype.disable=function(e,n){let t=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(o){t=t.concat(this[o].ruler.disable(e,!0))},this),t=t.concat(this.inline.ruler2.disable(e,!0));let r=e.filter(function(o){return t.indexOf(o)<0});if(r.length&&!n)throw new Error("MarkdownIt. Failed to disable unknown rule(s): "+r);return this};dn.prototype.use=function(e){let n=[this].concat(Array.prototype.slice.call(arguments,1));return e.apply(e,n),this};dn.prototype.parse=function(e,n){if(typeof e!="string")throw new Error("Input data should be a String");let t=new this.core.State(e,this,n);return this.core.process(t),t.tokens};dn.prototype.render=function(e,n){return n=n||{},this.renderer.render(this.parse(e,n),this.options,n)};dn.prototype.parseInline=function(e,n){let t=new this.core.State(e,this,n);return t.inlineMode=!0,this.core.process(t),t.tokens};dn.prototype.renderInline=function(e,n){return n=n||{},this.renderer.render(this.parseInline(e,n),this.options,n)};var Nc=dn;var x1=document.createElement("style");x1.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Styles for MarkdownRenderer component
 */

.markdown-content {
  /* Base styles for markdown content */
  line-height: 1.6;
  color: var(--app-primary-foreground);
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h1 {
  font-size: 1.75em;
  border-bottom: 1px solid var(--app-primary-border-color);
  padding-bottom: 0.3em;
}

.markdown-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--app-primary-border-color);
  padding-bottom: 0.3em;
}

.markdown-content h3 {
  font-size: 1.25em;
}

.markdown-content h4 {
  font-size: 1.1em;
}

.markdown-content h5,
.markdown-content h6 {
  font-size: 1em;
}

.markdown-content p {
  margin-top: 0;
  /* margin-bottom: 1em; */
}

.markdown-content ul,
.markdown-content ol {
  margin-top: 1em;
  margin-bottom: 1em;
  padding-left: 2em;
}

/* Ensure list markers are visible even with global CSS resets */
.markdown-content ul {
  list-style-type: disc;
  list-style-position: outside;
}

.markdown-content ol {
  list-style-type: decimal;
  list-style-position: outside;
}

/* Nested list styles */
.markdown-content ul ul {
  list-style-type: circle;
}

.markdown-content ul ul ul {
  list-style-type: square;
}

.markdown-content ol ol {
  list-style-type: lower-alpha;
}

.markdown-content ol ol ol {
  list-style-type: lower-roman;
}

/* Style the marker explicitly so themes don't hide it */
.markdown-content li::marker {
  color: var(--app-secondary-foreground);
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content li > p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-content blockquote {
  margin: 0 0 1em;
  padding: 0 1em;
  border-left: 0.25em solid var(--app-primary-border-color);
  color: var(--app-secondary-foreground);
}

.markdown-content a {
  color: var(--app-link-foreground, #007acc);
  text-decoration: none;
}

.markdown-content a:hover {
  color: var(--app-link-active-foreground, #005a9e);
  text-decoration: underline;
}

.markdown-content code {
  font-family: var(
    --app-monospace-font-family,
    'SF Mono',
    Monaco,
    'Cascadia Code',
    'Roboto Mono',
    Consolas,
    'Courier New',
    monospace
  );
  font-size: 0.9em;
  background-color: var(--app-code-background, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--app-primary-border-color);
  border-radius: var(--corner-radius-small, 4px);
  padding: 0.2em 0.4em;
  white-space: pre-wrap; /* Support automatic line wrapping */
  word-break: break-word; /* Break words when necessary */
}

.markdown-content pre {
  margin: 1em 0;
  padding: 1em;
  overflow-x: auto;
  background-color: var(--app-code-background, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--app-primary-border-color);
  border-radius: var(--corner-radius-small, 4px);
  font-family: var(
    --app-monospace-font-family,
    'SF Mono',
    Monaco,
    'Cascadia Code',
    'Roboto Mono',
    Consolas,
    'Courier New',
    monospace
  );
  font-size: 0.9em;
  line-height: 1.5;
}

.markdown-content pre code {
  background: none;
  border: none;
  padding: 0;
  white-space: pre-wrap; /* Support automatic line wrapping */
  word-break: break-word; /* Break words when necessary */
}

.markdown-content .file-path-link {
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(
    --app-monospace-font-family,
    'SF Mono',
    Monaco,
    'Cascadia Code',
    'Roboto Mono',
    Consolas,
    'Courier New',
    monospace
  );
  font-size: 0.95em;
  color: var(--app-link-foreground, #007acc);
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.1s ease;
}

.markdown-content .file-path-link:hover {
  color: var(--app-link-active-foreground, #005a9e);
}

.markdown-content hr {
  border: none;
  border-top: 1px solid var(--app-primary-border-color);
  margin: 1.5em 0;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-content th,
.markdown-content td {
  padding: 0.5em 1em;
  border: 1px solid var(--app-primary-border-color);
  text-align: left;
}

.markdown-content th {
  background-color: var(--app-secondary-background);
  font-weight: 600;
}
`;document.head.appendChild(x1);var b1=A(D(),1);var Rc=/(?:[a-zA-Z]:)?[/\\](?:[\w\-. ]+[/\\])+[\w\-. ]+\.(tsx?|jsx?|css|scss|json|md|py|java|go|rs|c|cpp|h|hpp|sh|yaml|yml|toml|xml|html|vue|svelte)/gi,Ic=/(?:[a-zA-Z]:)?[/\\](?:[\w\-. ]+[/\\])+[\w\-. ]+\.(tsx?|jsx?|css|scss|json|md|py|java|go|rs|c|cpp|h|hpp|sh|yaml|yml|toml|xml|html|vue|svelte)#(\d+)(?:-(\d+))?/gi,v1=({content:e,onFileClick:n,enableFileLinks:t=!0})=>{let r=()=>new Nc({html:!1,xhtmlOut:!1,breaks:!0,linkify:!0,typographer:!0}),o=()=>{try{let l=r().render(e);return t&&(l=a(l)),l}catch(s){return console.error("Error rendering markdown:",s),u(e)}},u=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),a=s=>{if(typeof document>"u")return s;let l=new RegExp(Rc.source,Rc.flags.replace("g","")),f=new RegExp(Ic.source,Ic.flags.replace("g","")),m=/[\w\-. ]+\.(tsx?|jsx?|css|scss|json|md|py|java|go|rs|c|cpp|h|hpp|sh|ya?ml|toml|xml|html|vue|svelte)/i,g=document.createElement("div");g.innerHTML=s;let v=new RegExp(`${Ic.source}|${Rc.source}|${m.source}`,"gi"),x=c=>{let p=c,b=c,y=c.indexOf("#");if(y>=0){let _=c.slice(y+1).match(/^L?(\d+)(?:-\d+)?$/i);if(_){let T=parseInt(_[1],10);return b=c.slice(0,y),{displayText:p,dataPath:`${b}:${T}`}}}return{displayText:p,dataPath:b}},w=c=>{let p=document.createElement("a"),{dataPath:b}=x(c);return p.className="file-path-link",p.textContent=c,p.setAttribute("href","#"),p.setAttribute("title",`Open ${c}`),p.setAttribute("data-file-path",b),p},C=c=>{let p=c.getAttribute("href")||"",b=(c.textContent||"").trim(),y=T=>m.test(T)||/[/\\]/.test(T)?!1:/^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)+$/.test(T);if(p.match(/^https?:\/\/(.+)$/i))try{let T=new URL(p),S=T.hostname||"",N=T.pathname||"",P=N===""||N==="/";if(P&&m.test(b)&&S.toLowerCase()===b.toLowerCase()){let{dataPath:tn}=x(b);c.classList.add("file-path-link"),c.setAttribute("href","#"),c.setAttribute("title",`Open ${b}`),c.setAttribute("data-file-path",tn);return}if(P&&m.test(S)){let{dataPath:tn}=x(S);c.classList.add("file-path-link"),c.setAttribute("href","#"),c.setAttribute("title",`Open ${b||S}`),c.setAttribute("data-file-path",tn);return}}catch{}if(/^(https?|mailto|ftp|data):/i.test(p))return;let _=p||b;if(!y(_)){if(f.test(_)||l.test(_)){let{dataPath:T}=x(_);c.classList.add("file-path-link"),c.setAttribute("href","#"),c.setAttribute("title",`Open ${b||p}`),c.setAttribute("data-file-path",T);return}if(m.test(_)){let{dataPath:T}=x(_);c.classList.add("file-path-link"),c.setAttribute("href","#"),c.setAttribute("title",`Open ${b||p}`),c.setAttribute("data-file-path",T)}}},h=c=>m.test(c)||/[/\\]/.test(c)?!1:/^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)+$/.test(c),d=c=>{if(c.nodeType===Node.ELEMENT_NODE){let p=c;if(p.tagName.toLowerCase()==="a"){C(p);return}let b=p.tagName.toLowerCase();if(b==="code"||b==="pre")return}for(let p=c.firstChild;p;){let b=p.nextSibling;if(p.nodeType===Node.TEXT_NODE){let y=p.nodeValue||"";v.lastIndex=0;let k=v.test(y);if(v.lastIndex=0,k){let _=document.createDocumentFragment(),T=0,S;for(;S=v.exec(y);){let N=S[0],P=S.index;if(h(N)){P>T&&_.appendChild(document.createTextNode(y.slice(T,P))),_.appendChild(document.createTextNode(N)),T=P+N.length;continue}P>T&&_.appendChild(document.createTextNode(y.slice(T,P))),_.appendChild(w(N)),T=P+N.length}T<y.length&&_.appendChild(document.createTextNode(y.slice(T))),c.replaceChild(_,p)}}else p.nodeType===Node.ELEMENT_NODE&&d(p);p=b}};return d(g),g.innerHTML};return(0,b1.jsx)("div",{className:"markdown-content",onClick:s=>{if(!t)return;let l=s.target;if(!l)return;let f=l.closest&&l.closest("a.file-path-link");if(f){let v=f.getAttribute("data-file-path");if(!v)return;s.preventDefault(),s.stopPropagation(),n?.(v);return}let m=l.closest&&l.closest("a");if(!m)return;let g=m.getAttribute("href")||"";if(/^https?:\/\//i.test(g))try{let v=new URL(g),x=v.hostname||"",w=v.pathname||"";if((w===""||w==="/")&&/\.[a-z0-9]+$/i.test(x)){let h=(m.textContent||"").trim(),d=/\.[a-z0-9]+$/i.test(h)?h:x;s.preventDefault(),s.stopPropagation(),n?.(d)}}catch{}},dangerouslySetInnerHTML:{__html:o()},style:{wordWrap:"break-word",overflowWrap:"break-word",whiteSpace:"normal"}})};var y1=A(D(),1);var Hr=({content:e,onFileClick:n,enableFileLinks:t})=>(0,y1.jsx)(v1,{content:e,onFileClick:n,enableFileLinks:t});var Nt=A(D(),1);var Mc=({content:e,timestamp:n,onFileClick:t,fileContext:r})=>{let u=(()=>{if(!r)return null;let{fileName:a,startLine:i,endLine:s}=r;return i&&s?i===s?`${a}#${i}`:`${a}#${i}-${s}`:a})();return(0,Nt.jsxs)("div",{className:"qwen-message user-message-container flex gap-0 my-1 items-start text-left flex-col relative",style:{position:"relative"},children:[(0,Nt.jsx)("div",{className:"inline-block relative whitespace-pre-wrap rounded-md max-w-full overflow-x-auto overflow-y-hidden select-text leading-[1.5]",style:{border:"1px solid var(--app-input-border)",borderRadius:"var(--corner-radius-medium)",backgroundColor:"var(--app-input-background)",padding:"4px 6px",color:"var(--app-primary-foreground)"},children:(0,Nt.jsx)(Hr,{content:e,onFileClick:t,enableFileLinks:!1})}),u&&(0,Nt.jsx)("div",{className:"mt-1",children:(0,Nt.jsx)("div",{role:"button",tabIndex:0,className:"mr inline-flex items-center py-0 pr-2 gap-1 rounded-sm cursor-pointer relative opacity-50",onClick:()=>r&&t?.(r.filePath),onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&r&&t?.(r.filePath)},children:(0,Nt.jsx)("div",{className:"gr",title:u,style:{fontSize:"12px",color:"var(--app-secondary-foreground)"},children:u})})})]})};var w1=document.createElement("style");w1.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * AssistantMessage Component Styles
 * Pseudo-elements (::before) for bullet points and (::after) for timeline connectors
 */

/* Bullet point indicator using ::before pseudo-element */
.assistant-message-container.assistant-message-default::before,
.assistant-message-container.assistant-message-success::before,
.assistant-message-container.assistant-message-error::before,
.assistant-message-container.assistant-message-warning::before,
.assistant-message-container.assistant-message-loading::before {
  content: '\\25cf';
  position: absolute;
  left: 8px;
  padding-top: 2px;
  font-size: 10px;
  z-index: 1;
}

/* Default state - secondary foreground color */
.assistant-message-container.assistant-message-default::before {
  color: var(--app-secondary-foreground);
}

/* Success state - green bullet (maps to .ge) */
.assistant-message-container.assistant-message-success::before {
  color: #74c991;
}

/* Error state - red bullet (maps to .be) */
.assistant-message-container.assistant-message-error::before {
  color: #c74e39;
}

/* Warning state - yellow/orange bullet (maps to .ue) */
.assistant-message-container.assistant-message-warning::before {
  color: #e1c08d;
}

/* Loading state - static bullet (maps to .he) */
.assistant-message-container.assistant-message-loading::before {
  color: var(--app-secondary-foreground);
  background-color: var(--app-secondary-background);
}

.assistant-message-container.assistant-message-loading::after {
  display: none;
}
`;document.head.appendChild(w1);var $o=A(D(),1);var Pc=({content:e,timestamp:n,onFileClick:t,status:r="default",hideStatusIcon:o=!1})=>!e||e.trim().length===0?null:(0,$o.jsx)("div",{className:`qwen-message message-item assistant-message-container ${(()=>{if(o)return"";switch(r){case"success":return"assistant-message-success";case"error":return"assistant-message-error";case"warning":return"assistant-message-warning";case"loading":return"assistant-message-loading";default:return"assistant-message-default"}})()}`,style:{width:"100%",alignItems:"flex-start",paddingLeft:"30px",userSelect:"text",position:"relative"},children:(0,$o.jsx)("span",{style:{width:"100%"},children:(0,$o.jsx)("div",{style:{margin:0,width:"100%",wordWrap:"break-word",overflowWrap:"break-word",whiteSpace:"normal"},children:(0,$o.jsx)(Hr,{content:e,onFileClick:t,enableFileLinks:!1})})})});var ut=A(D(),1);var Lc=({content:e,timestamp:n,onFileClick:t})=>(0,ut.jsx)("div",{className:"qwen-message thinking-message flex gap-0 items-start text-left py-2 flex-col relative opacity-80 italic pl-6 animate-[fadeIn_0.2s_ease-in]",children:(0,ut.jsxs)("div",{className:"inline-block my-1 relative whitespace-pre-wrap rounded-md max-w-full overflow-x-auto overflow-y-hidden select-text leading-[1.5]",style:{backgroundColor:"var(--app-list-hover-background, rgba(100, 100, 255, 0.1))",border:"1px solid rgba(100, 100, 255, 0.3)",borderRadius:"var(--corner-radius-medium)",padding:"var(--app-spacing-medium)",color:"var(--app-primary-foreground)"},children:[(0,ut.jsxs)("span",{className:"inline-flex items-center gap-1 mr-2",children:[(0,ut.jsx)("span",{className:"inline-block w-1.5 h-1.5 bg-[var(--app-secondary-foreground)] rounded-full opacity-60 animate-[typingPulse_1.4s_infinite_ease-in-out] [animation-delay:0s]"}),(0,ut.jsx)("span",{className:"inline-block w-1.5 h-1.5 bg-[var(--app-secondary-foreground)] rounded-full opacity-60 animate-[typingPulse_1.4s_infinite_ease-in-out] [animation-delay:0.2s]"}),(0,ut.jsx)("span",{className:"inline-block w-1.5 h-1.5 bg-[var(--app-secondary-foreground)] rounded-full opacity-60 animate-[typingPulse_1.4s_infinite_ease-in-out] [animation-delay:0.4s]"})]}),(0,ut.jsx)(Hr,{content:e,onFileClick:t})]})});var nr=A(xe(),1);var k1=document.createElement("style");k1.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

@import url('../Assistant/AssistantMessage.css');

/* Subtle shimmering highlight across the loading text */
@keyframes waitingMessageShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.loading-text-shimmer {
  /* Use the theme foreground as the base color, with a moving light band */
  background-image: linear-gradient(
    90deg,
    var(--app-secondary-foreground) 0%,
    var(--app-secondary-foreground) 40%,
    rgba(255, 255, 255, 0.95) 50%,
    var(--app-secondary-foreground) 60%,
    var(--app-secondary-foreground) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent; /* text color comes from the gradient */
  animation: waitingMessageShimmer 1.6s linear infinite;
}

.interrupted-item::after {
  display: none;
}
`;document.head.appendChild(k1);var ja=A(D(),1);var Tv=3e3,zc=({loadingMessage:e})=>{let n=(0,nr.useMemo)(()=>{let o=new Set,u=[];e&&e.trim()&&(u.push(e),o.add(e));for(let a of ga)o.has(a)||u.push(a);return u},[e]),[t,r]=(0,nr.useState)(0);return(0,nr.useEffect)(()=>{r(0)},[n]),(0,nr.useEffect)(()=>{if(n.length<=1)return;let o=setInterval(()=>{r(u=>{let a=Math.floor(Math.random()*n.length);if(n.length>1){let i=0;for(;a===u&&i<5;)a=Math.floor(Math.random()*n.length),i++}return a})},Tv);return()=>clearInterval(o)},[n]),(0,ja.jsx)("div",{className:"waiting-message-outer flex gap-0 items-start text-left py-2 flex-col opacity-85",children:(0,ja.jsx)("div",{className:"assistant-message-container assistant-message-loading waiting-message-inner w-full items-start pl-[30px] relative",children:(0,ja.jsx)("span",{className:"waiting-message-text opacity-70 italic loading-text-shimmer",children:n[t]})})})};var qa=A(D(),1);var Oc=({text:e="Interrupted"})=>(0,qa.jsx)("div",{className:"flex gap-0 items-start text-left py-2 flex-col opacity-85",children:(0,qa.jsx)("div",{className:"interrupted-item w-full relative",children:(0,qa.jsx)("span",{className:"opacity-70 italic",children:e})})});var On=A(xe(),1),Cn=A(D(),1);var C1=({items:e,onSelect:n,onClose:t,title:r,selectedIndex:o=0})=>{let u=(0,On.useRef)(null),[a,i]=(0,On.useState)(o),[s,l]=(0,On.useState)(!1);return(0,On.useEffect)(()=>i(o),[o]),(0,On.useEffect)(()=>l(!0),[]),(0,On.useEffect)(()=>{let f=g=>{u.current&&!u.current.contains(g.target)&&t()},m=g=>{switch(g.key){case"ArrowDown":g.preventDefault(),i(v=>Math.min(v+1,e.length-1));break;case"ArrowUp":g.preventDefault(),i(v=>Math.max(v-1,0));break;case"Enter":g.preventDefault(),e[a]&&n(e[a]);break;case"Escape":g.preventDefault(),t();break;default:break}};return document.addEventListener("mousedown",f),document.addEventListener("keydown",m),()=>{document.removeEventListener("mousedown",f),document.removeEventListener("keydown",m)}},[e,a,n,t]),(0,On.useEffect)(()=>{let f=u.current?.querySelector(`[data-index="${a}"]`);f&&f.scrollIntoView({block:"nearest"})},[a]),e.length?(0,Cn.jsxs)("div",{ref:u,role:"menu",className:["completion-menu","absolute bottom-full left-0 right-0 mb-2 flex flex-col overflow-hidden","rounded-large border bg-[var(--app-menu-background)]","border-[var(--app-input-border)] max-h-[50vh] z-[1000]",s?"animate-completion-menu-enter":""].join(" "),children:[(0,Cn.jsx)("div",{className:"h-1"}),(0,Cn.jsxs)("div",{className:["completion-menu-list","flex max-h-[300px] flex-col overflow-y-auto","p-[var(--app-list-padding)] pb-2 gap-[var(--app-list-gap)]"].join(" "),children:[r&&(0,Cn.jsx)("div",{className:"completion-menu-section-label px-3 py-1 text-[var(--app-primary-foreground)] opacity-50 text-[0.9em]",children:r}),e.map((f,m)=>{let g=m===a;return(0,Cn.jsx)("div",{"data-index":m,role:"menuitem",onClick:()=>n(f),onMouseEnter:()=>i(m),className:["completion-menu-item","mx-1 cursor-pointer rounded-[var(--app-list-border-radius)]","p-[var(--app-list-item-padding)]",g?"bg-[var(--app-list-active-background)]":""].join(" "),children:(0,Cn.jsxs)("div",{className:"completion-menu-item-row flex items-center justify-between gap-2",children:[f.icon&&(0,Cn.jsx)("span",{className:"completion-menu-item-icon inline-flex h-4 w-4 items-center justify-center text-[var(--vscode-symbolIcon-fileForeground,#cccccc)]",children:f.icon}),(0,Cn.jsx)("span",{className:["completion-menu-item-label flex-1 truncate",g?"text-[var(--app-list-active-foreground)]":"text-[var(--app-primary-foreground)]"].join(" "),children:f.label}),f.description&&(0,Cn.jsx)("span",{className:"completion-menu-item-desc max-w-[50%] truncate text-[0.9em] text-[var(--app-secondary-foreground)] opacity-70",title:f.description,children:f.description})]})},f.id)})]})]}):null};var _1={plan:"plan",default:"default","auto-edit":"auto-edit",yolo:"yolo"},S1={plan:{label:"Plan mode",title:"Qwen will plan before executing. Click to switch modes.",iconType:"plan"},default:{label:"Ask before edits",title:"Qwen will ask before each edit. Click to switch modes.",iconType:"edit"},"auto-edit":{label:"Edit automatically",title:"Qwen will edit files automatically. Click to switch modes.",iconType:"auto"},yolo:{label:"YOLO",title:"Automatically approve all tools. Click to switch modes.",iconType:"yolo"}};function Bc(e){let n=_1[e];return n!==void 0?S1[n]:{label:"Unknown mode",title:"Unknown edit mode",iconType:void 0}}var E1={default:"auto-edit","auto-edit":"yolo",plan:"yolo",yolo:"default"};var W=A(D(),1);var Dv=e=>{let n=Bc(e),t=null;switch(n.iconType){case"edit":t=(0,W.jsx)(yl,{});break;case"auto":t=(0,W.jsx)(wa,{});break;case"plan":t=(0,W.jsx)(wl,{});break;case"yolo":t=(0,W.jsx)(wa,{});break;default:t=null;break}return{text:n.label,title:n.title,icon:t}},T1=({inputText:e,inputFieldRef:n,isStreaming:t,isWaitingForResponse:r,isComposing:o,editMode:u,activeFileName:a,activeSelection:i,skipAutoActiveContext:s,onInputChange:l,onCompositionStart:f,onCompositionEnd:m,onKeyDown:g,onSubmit:v,onCancel:x,onToggleEditMode:w,onToggleSkipAutoActiveContext:C,onShowCommandMenu:h,onAttachContext:d,completionIsOpen:c,completionItems:p,onCompletionSelect:b,onCompletionClose:y})=>{let k=Dv(u),_=t||r,T=P=>{if(P.key==="Escape"){P.preventDefault(),x();return}if(P.key==="Enter"&&!P.shiftKey&&!o){if(c)return;P.preventDefault(),v(P)}g(P)},S=i?Math.max(1,i.endLine-i.startLine+1):0,N=S>0?`${S} ${S===1?"line":"lines"} selected`:"";return(0,W.jsx)("div",{className:"p-1 px-4 pb-4 absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-[var(--app-primary-background)]",children:(0,W.jsx)("div",{className:"block",children:(0,W.jsxs)("form",{className:"composer-form",onSubmit:v,children:[(0,W.jsx)("div",{className:"composer-overlay"}),(0,W.jsx)("div",{className:"input-banner"}),(0,W.jsxs)("div",{className:"relative flex z-[1]",children:[c&&p&&p.length>0&&b&&y&&(0,W.jsx)(C1,{items:p,onSelect:b,onClose:y,title:void 0}),(0,W.jsx)("div",{ref:n,contentEditable:"plaintext-only",className:"composer-input",role:"textbox","aria-label":"Message input","aria-multiline":"true","data-placeholder":"Ask Qwen Code \u2026","data-empty":e.replace(/\u200B/g,"").trim().length===0?"true":"false",onInput:P=>{let G=P.target.textContent?.replace(/\u200B/g,"")||"";l(G)},onCompositionStart:f,onCompositionEnd:m,onKeyDown:T,suppressContentEditableWarning:!0})]}),(0,W.jsxs)("div",{className:"composer-actions",children:[(0,W.jsxs)("button",{type:"button",className:"btn-text-compact btn-text-compact--primary",title:k.title,onClick:w,children:[k.icon,(0,W.jsx)("span",{className:"hidden sm:inline",children:k.text})]}),a&&(0,W.jsxs)("button",{type:"button",className:"btn-text-compact btn-text-compact--primary",title:s?N?`Active selection will NOT be auto-loaded into context: ${N}`:`Active file will NOT be auto-loaded into context: ${a}`:N?`Showing Qwen Code your current selection: ${N}`:`Showing Qwen Code your current file: ${a}`,onClick:C,children:[s?(0,W.jsx)(Cl,{}):(0,W.jsx)(kl,{}),(0,W.jsx)("span",{className:"hidden sm:inline",children:N||a})]}),(0,W.jsx)("div",{className:"flex-1 min-w-0"}),(0,W.jsx)("button",{type:"button",className:"btn-icon-compact hover:text-[var(--app-primary-foreground)]",title:"Show command menu (/)",onClick:h,children:(0,W.jsx)(_l,{})}),(0,W.jsx)("button",{type:"button",className:"btn-icon-compact hover:text-[var(--app-primary-foreground)]",title:"Attach context (Cmd/Ctrl + /)",onClick:d,children:(0,W.jsx)(Sl,{})}),t||r?(0,W.jsx)("button",{type:"button",className:"btn-send-compact [&>svg]:w-5 [&>svg]:h-5",onClick:x,title:"Stop generation",children:(0,W.jsx)(Al,{})}):(0,W.jsx)("button",{type:"submit",className:"btn-send-compact [&>svg]:w-5 [&>svg]:h-5",disabled:_||!e.trim(),children:(0,W.jsx)(vl,{})})]})]})})})};var F1=A(xe(),1);var A1=e=>{let n=new Date,t=new Date(n.getFullYear(),n.getMonth(),n.getDate()),r=new Date(t);r.setDate(r.getDate()-1);let o={Today:[],Yesterday:[],"This Week":[],Older:[]};return e.forEach(u=>{let a=u.lastUpdated||u.startTime||"";if(!a){o.Older.push(u);return}let i=new Date(a),s=new Date(i.getFullYear(),i.getMonth(),i.getDate());s.getTime()===t.getTime()?o.Today.push(u):s.getTime()===r.getTime()?o.Yesterday.push(u):s.getTime()>t.getTime()-6048e5?o["This Week"].push(u):o.Older.push(u)}),Object.entries(o).filter(([,u])=>u.length>0).map(([u,a])=>({label:u,sessions:a}))},D1=e=>{if(!e)return"";let n=new Date().getTime(),t=new Date(e).getTime(),r=n-t,o=Math.floor(r/6e4),u=Math.floor(r/36e5),a=Math.floor(r/864e5);return o<1?"now":o<60?`${o}m`:u<24?`${u}h`:a===1?"Yesterday":a<7?`${a}d`:new Date(e).toLocaleDateString()};var pe=A(D(),1);var N1=({visible:e,sessions:n,currentSessionId:t,searchQuery:r,onSearchChange:o,onSelectSession:u,onClose:a,hasMore:i=!1,isLoading:s=!1,onLoadMore:l})=>{if(!e)return null;let f=n.length===0;return(0,pe.jsxs)(pe.Fragment,{children:[(0,pe.jsx)("div",{className:"session-selector-backdrop fixed top-0 left-0 right-0 bottom-0 z-[999] bg-transparent",onClick:a}),(0,pe.jsxs)("div",{className:"session-dropdown fixed bg-[var(--app-menu-background)] rounded-[var(--corner-radius-small)] w-[min(400px,calc(100vw-32px))] max-h-[min(500px,50vh)] flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.1)] z-[1000] outline-none text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)]",tabIndex:-1,style:{top:"30px",left:"10px"},onClick:m=>m.stopPropagation(),children:[(0,pe.jsxs)("div",{className:"session-search p-2 flex items-center gap-2",children:[(0,pe.jsx)(bl,{className:"session-search-icon w-4 h-4 opacity-50 flex-shrink-0 text-[var(--app-primary-foreground)]"}),(0,pe.jsx)("input",{type:"text",className:"session-search-input flex-1 bg-transparent border-none outline-none text-[var(--app-menu-foreground)] text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] p-0 placeholder:text-[var(--app-input-placeholder-foreground)] placeholder:opacity-60",placeholder:"Search sessions\u2026",value:r,onChange:m=>o(m.target.value)})]}),(0,pe.jsxs)("div",{className:"session-list-content overflow-y-auto flex-1 select-none p-2",onScroll:m=>{let g=m.currentTarget;g.scrollHeight-(g.scrollTop+g.clientHeight)<48&&i&&!s&&l?.()},children:[f?(0,pe.jsx)("div",{className:"p-5 text-center text-[var(--app-secondary-foreground)]",style:{padding:"20px",textAlign:"center",color:"var(--app-secondary-foreground)"},children:r?"No matching sessions":"No sessions available"}):A1(n).map(m=>(0,pe.jsxs)(F1.default.Fragment,{children:[(0,pe.jsx)("div",{className:"session-group-label p-1 px-2 text-[var(--app-primary-foreground)] opacity-50 text-[0.9em] font-medium [&:not(:first-child)]:mt-2",children:m.label}),(0,pe.jsx)("div",{className:"session-group flex flex-col gap-[2px]",children:m.sessions.map(g=>{let v=g.id||g.sessionId||"",x=g.title||g.name||"Untitled",w=g.lastUpdated||g.startTime||"";return(0,pe.jsxs)("button",{className:`session-item flex items-center justify-between py-1.5 px-2 bg-transparent border-none rounded-md cursor-pointer text-left w-full text-[var(--vscode-chat-font-size,13px)] font-[var(--vscode-chat-font-family)] text-[var(--app-primary-foreground)] transition-colors duration-100 hover:bg-[var(--app-list-hover-background)] ${v===t?"active bg-[var(--app-list-active-background)] text-[var(--app-list-active-foreground)] font-[600]":""}`,onClick:()=>{u(v),a()},children:[(0,pe.jsx)("span",{className:"session-item-title flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0",children:x}),(0,pe.jsx)("span",{className:"session-item-time opacity-60 text-[0.9em] flex-shrink-0 ml-3",children:D1(w)})]},v)})})]},m.label)),i&&(0,pe.jsx)("div",{className:"p-2 text-center opacity-60 text-[0.9em]",children:s?"Loading\u2026":""})]})]})]})};var Z=A(D(),1);var R1=()=>{let e=Fn(),n=Sf(e),t=Ef(e),r=Tf(),{inProgressToolCalls:o,completedToolCalls:u,handleToolCallUpdate:a,clearToolCalls:i}=Af(),[s,l]=(0,U.useState)(""),[f,m]=(0,U.useState)(null),[g,v]=(0,U.useState)([]),[x,w]=(0,U.useState)(null),[C,h]=(0,U.useState)(!0),d=(0,U.useRef)(null),c=(0,U.useRef)(null),p=(0,U.useRef)(null),[b,y]=(0,U.useState)("default"),[k,_]=(0,U.useState)(!1),[T,S]=(0,U.useState)(!1),[N,P]=(0,U.useState)(!1),tn=U.default.useCallback(async(R,I)=>{if(R==="@"){console.log("[App] getCompletionItems @ called",{query:I,requested:t.hasRequestedFiles,workspaceFiles:t.workspaceFiles.length}),t.requestWorkspaceFiles(I);let q=(0,Z.jsx)(hl,{}),M=t.workspaceFiles.map(H=>({id:H.id,label:H.label,description:H.description,type:"file",icon:q,value:H.label,path:H.path}));if(I&&I.length>=1){let H=I.toLowerCase();return M.filter(Be=>Be.label.toLowerCase().includes(H)||Be.description&&Be.description.toLowerCase().includes(H))}return M.length===0?[{id:"loading-files",label:"Searching files\u2026",description:"Type to filter, or wait a moment\u2026",type:"info"}]:M}else return[{id:"login",label:"/login",description:"Login to Qwen Code",type:"command",icon:(0,Z.jsx)(El,{})}].filter(M=>M.label.toLowerCase().includes(I.toLowerCase()))},[t]),G=dm(p,tn),We=(0,U.useMemo)(()=>t.workspaceFiles.map(R=>`${R.id}|${R.label}|${R.description??""}|${R.path}`).join("||"),[t.workspaceFiles]);(0,U.useEffect)(()=>{G.isOpen&&G.triggerChar==="@"&&!G.query&&G.refreshCompletion()},[We,G.isOpen,G.triggerChar,G.query]);let{handleSubmit:tr}=Rf({inputText:s,setInputText:l,messageHandling:r,fileContext:t,skipAutoActiveContext:N,vscode:e,inputFieldRef:p,isStreaming:r.isStreaming,isWaitingForResponse:r.isWaitingForResponse}),Uc=(0,U.useCallback)(()=>{if(r.isStreaming||r.isWaitingForResponse){try{r.endStreaming?.()}catch{}try{r.clearWaitingForResponse?.()}catch{}r.addMessage({role:"assistant",content:"Interrupted",timestamp:Date.now()})}e.postMessage({type:"cancelStreaming",data:{}})},[r,e]);Df({sessionManagement:n,fileContext:t,messageHandling:r,handleToolCallUpdate:a,clearToolCalls:i,setPlanEntries:v,handlePermissionRequest:m,inputFieldRef:p,setInputText:l,setEditMode:y,setIsAuthenticated:w});let[Wo,jc]=(0,U.useState)(!0),qc=(0,U.useRef)({msgLen:0,inProgLen:0,doneLen:0});(0,U.useEffect)(()=>{let R=c.current;if(!R)return;let I=()=>{let M=R.scrollHeight-(R.scrollTop+R.clientHeight);jc(M<=80)};return I(),R.addEventListener("scroll",I,{passive:!0}),()=>R.removeEventListener("scroll",I)},[]),(0,U.useLayoutEffect)(()=>{let R=c.current;if(!R)return;let I=qc.current,q=r.messages.length>I.msgLen,M=o.length>I.inProgLen,H=u.length>I.doneLen;if(qc.current={msgLen:r.messages.length,inProgLen:o.length,doneLen:u.length},!Wo)return;let Be=q||M||H,or=requestAnimationFrame(()=>{let Bn=R.scrollHeight-R.clientHeight;R.scrollTo({top:Bn,behavior:Be?"smooth":"auto"})});return()=>cancelAnimationFrame(or)},[Wo,r.messages,o,u,r.isWaitingForResponse,r.loadingMessage,r.isStreaming,g]),(0,U.useEffect)(()=>{let R=c.current,I=d.current;if(!R||!I)return;let q=I.previousElementSibling;if(!q)return;let M=0,H=new ResizeObserver(()=>{Wo&&(cancelAnimationFrame(M),M=requestAnimationFrame(()=>{let Be=R.scrollHeight-R.clientHeight;R.scrollTo({top:Be})}))});return H.observe(q),()=>{cancelAnimationFrame(M),H.disconnect()}},[Wo,r.messages,o,u]),(0,U.useEffect)(()=>{x!==null&&h(!1)},[x]);let B1=(0,U.useCallback)(R=>{e.postMessage({type:"permissionResponse",data:{optionId:R}}),m(null)},[e]),U1=(0,U.useCallback)(R=>{let I=p.current;if(!I)return;if(R.type==="info"){G.closeCompletion();return}if(R.type==="command"&&(R.label||"").trim()==="/login"){e.postMessage({type:"login",data:{}}),G.closeCompletion();return}if(R.type==="file"&&R.value&&R.path)try{t.addFileReference(R.value,R.path)}catch(Un){console.warn("[App] addFileReference failed:",Un)}let q=window.getSelection();if(!q||q.rangeCount===0)return;let M=I.textContent||"",H=q.getRangeAt(0),Be=M.length;if(H.startContainer===I){let Un=H.startOffset,jn=0;for(let pn=0;pn<Un&&pn<I.childNodes.length;pn++)jn+=I.childNodes[pn].textContent?.length||0;Be=jn||M.length}else if(H.startContainer.nodeType===Node.TEXT_NODE){let Un=document.createTreeWalker(I,NodeFilter.SHOW_TEXT,null),jn=0,pn=!1,Rt=Un.nextNode();for(;Rt;){if(Rt===H.startContainer){jn+=H.startOffset,pn=!0;break}jn+=Rt.textContent?.length||0,Rt=Un.nextNode()}Be=pn?jn:M.length}let or=M.substring(0,Be),Bn=or.lastIndexOf("@"),Q1=or.lastIndexOf("/"),Hc=Math.max(Bn,Q1);if(Hc>=0){let Un=typeof R.value=="string"?R.value:String(R.label),jn=M.substring(0,Hc+1)+Un+" "+M.substring(Be);I.textContent=jn,l(jn);let pn=document.createRange(),Rt=window.getSelection();pn.selectNodeContents(I),pn.collapse(!1),Rt?.removeAllRanges(),Rt?.addRange(pn)}G.closeCompletion()},[G,p,l,t,e]),j1=(0,U.useCallback)(()=>{e.postMessage({type:"attachFile",data:{}})},[e]),q1=(0,U.useCallback)(()=>{y(R=>{let I=E1[R];try{e.postMessage({type:"setApprovalMode",data:{modeId:I}})}catch{}return I})},[e]),H1=()=>{_(R=>!R)},V1=(0,U.useCallback)(R=>{jc(!0);let I=c.current;if(I){let q=I.scrollHeight-I.clientHeight;I.scrollTo({top:q})}tr(R)},[tr]),rr=(0,U.useMemo)(()=>{let R=r.messages.map(M=>({type:"message",data:M,timestamp:M.timestamp})),I=o.map(M=>({type:"in-progress-tool-call",data:M,timestamp:M.timestamp||Date.now()})),q=u.filter(Of).map(M=>({type:"completed-tool-call",data:M,timestamp:M.timestamp||Date.now()}));return[...R,...I,...q].sort((M,H)=>(M.timestamp||0)-(H.timestamp||0))},[r.messages,o,u]);console.log("[App] Rendering messages:",rr);let $1=(0,U.useCallback)(()=>rr.map((R,I)=>{switch(R.type){case"message":{let q=R.data,M=H=>{e.postMessage({type:"openFile",data:{path:H}})};if(q.role==="thinking")return(0,Z.jsx)(Lc,{content:q.content||"",timestamp:q.timestamp||0,onFileClick:M},`message-${I}`);if(q.role==="user")return(0,Z.jsx)(Mc,{content:q.content||"",timestamp:q.timestamp||0,onFileClick:M,fileContext:q.fileContext},`message-${I}`);{let H=(q.content||"").trim();return H==="Interrupted"||H==="Tool interrupted"?(0,Z.jsx)(Oc,{text:H},`message-${I}`):(0,Z.jsx)(Pc,{content:H,timestamp:q.timestamp||0,onFileClick:M},`message-${I}`)}}case"in-progress-tool-call":case"completed-tool-call":{let q=rr[I-1],M=rr[I+1],H=Bn=>!!Bn&&typeof Bn=="object"&&"type"in Bn&&(Bn.type==="in-progress-tool-call"||Bn.type==="completed-tool-call"),Be=!H(q),or=!H(M);return(0,Z.jsx)(im,{toolCall:R.data,isFirst:Be,isLast:or},`toolcall-${R.data.toolCallId}-${R.type}`)}default:return null}}),[rr,e]),W1=r.messages.length>0||r.isStreaming||o.length>0||u.length>0||g.length>0||rr.length>0;return(0,Z.jsxs)("div",{className:"chat-container relative",children:[C&&(0,Z.jsx)("div",{className:"bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm",children:(0,Z.jsxs)("div",{className:"text-center",children:[(0,Z.jsx)("div",{className:"border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"}),(0,Z.jsx)("p",{className:"text-muted-foreground text-sm",children:"Preparing Qwen Code..."})]})}),(0,Z.jsx)(N1,{visible:n.showSessionSelector,sessions:n.filteredSessions,currentSessionId:n.currentSessionId,searchQuery:n.sessionSearchQuery,onSearchChange:n.setSessionSearchQuery,onSelectSession:R=>{n.handleSwitchSession(R),n.setSessionSearchQuery("")},onClose:()=>n.setShowSessionSelector(!1),hasMore:n.hasMore,isLoading:n.isLoading,onLoadMore:n.handleLoadMoreSessions}),(0,Z.jsx)(fm,{currentSessionTitle:n.currentSessionTitle,onLoadSessions:n.handleLoadQwenSessions,onNewSession:n.handleNewQwenSession}),(0,Z.jsx)("div",{ref:c,className:"chat-messages messages-container flex-1 overflow-y-auto overflow-x-hidden pt-5 pr-5 pl-5 pb-[140px] flex flex-col relative min-w-0 focus:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:hover:bg-white/30 [&>*]:flex [&>*]:gap-0 [&>*]:items-start [&>*]:text-left [&>*]:py-2 [&>*:not(:last-child)]:pb-[8px] [&>*]:flex-col [&>*]:relative [&>*]:animate-[fadeIn_0.2s_ease-in]",children:!W1&&!C?x===!1?(0,Z.jsx)(cm,{onLogin:()=>{e.postMessage({type:"login",data:{}}),r.setWaitingForResponse("Logging in to Qwen Code...")}}):x===null?(0,Z.jsx)(ml,{loadingMessage:"Checking login status\u2026"}):(0,Z.jsx)(ml,{isAuthenticated:!0}):(0,Z.jsxs)(Z.Fragment,{children:[$1(),r.isWaitingForResponse&&r.loadingMessage&&(0,Z.jsx)("div",{className:"waiting-message-slot min-h-[28px]",children:(0,Z.jsx)(zc,{loadingMessage:r.loadingMessage})}),(0,Z.jsx)("div",{ref:d})]})}),x&&(0,Z.jsx)(T1,{inputText:s,inputFieldRef:p,isStreaming:r.isStreaming,isWaitingForResponse:r.isWaitingForResponse,isComposing:T,editMode:b,thinkingEnabled:k,activeFileName:t.activeFileName,activeSelection:t.activeSelection,skipAutoActiveContext:N,onInputChange:l,onCompositionStart:()=>S(!0),onCompositionEnd:()=>S(!1),onKeyDown:()=>{},onSubmit:V1,onCancel:Uc,onToggleEditMode:q1,onToggleThinking:H1,onFocusActiveEditor:t.focusActiveEditor,onToggleSkipAutoActiveContext:()=>P(R=>!R),onShowCommandMenu:async()=>{if(p.current){p.current.focus();let R=window.getSelection(),I={top:0,left:0};if(R&&R.rangeCount>0)try{let M=R.getRangeAt(0).getBoundingClientRect();if(M.top>0&&M.left>0)I={top:M.top,left:M.left};else{let H=p.current.getBoundingClientRect();I={top:H.top,left:H.left}}}catch(q){console.error("[App] Error getting cursor position:",q);let M=p.current.getBoundingClientRect();I={top:M.top,left:M.left}}else{let q=p.current.getBoundingClientRect();I={top:q.top,left:q.left}}await G.openCompletion("/","",I)}},onAttachContext:j1,completionIsOpen:G.isOpen,completionItems:G.items,onCompletionSelect:U1,onCompletionClose:G.closeCompletion}),x&&f&&(0,Z.jsx)(Lf,{isOpen:!!f,options:f.options,toolCall:f.toolCall,onResponse:B1,onClose:()=>m(null)})]})};var I1=document.createElement("style");I1.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

/*! tailwindcss v3.4.18 | MIT License | https://tailwindcss.com
 */

/*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

*,
::before,
::after {
  box-sizing: border-box; /* 1 */
  border-width: 0; /* 2 */
  border-style: solid; /* 2 */
  border-color: #e5e7eb; /* 2 */
}

::before,
::after {
  --tw-content: '';
}

/*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured \`sans\` font-family by default.
5. Use the user's configured \`sans\` font-feature-settings by default.
6. Use the user's configured \`sans\` font-variation-settings by default.
7. Disable tap highlights on iOS
*/

html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  -moz-tab-size: 4; /* 3 */
  -o-tab-size: 4;
     tab-size: 4; /* 3 */
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */
  font-feature-settings: normal; /* 5 */
  font-variation-settings: normal; /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}

/*
1. Remove the margin in all browsers.
2. Inherit line-height from \`html\` so users can set them as a class directly on the \`html\` element.
*/

body {
  margin: 0; /* 1 */
  line-height: inherit; /* 2 */
}

/*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}

/*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}

/*
Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  text-decoration: inherit;
}

/*
Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
1. Use the user's configured \`mono\` font-family by default.
2. Use the user's configured \`mono\` font-feature-settings by default.
3. Use the user's configured \`mono\` font-variation-settings by default.
4. Correct the odd \`em\` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */
  font-feature-settings: normal; /* 2 */
  font-variation-settings: normal; /* 3 */
  font-size: 1em; /* 4 */
}

/*
Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}

/*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

button,
input,
optgroup,
select,
textarea {
  font-family: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  font-size: 100%; /* 1 */
  font-weight: inherit; /* 1 */
  line-height: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
  color: inherit; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 3 */
}

/*
Remove the inheritance of text transform in Edge and Firefox.
*/

button,
select {
  text-transform: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

button,
input:where([type='button']),
input:where([type='reset']),
input:where([type='submit']) {
  -webkit-appearance: button; /* 1 */
  background-color: transparent; /* 2 */
  background-image: none; /* 2 */
}

/*
Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
Remove the additional \`:invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

[type='search'] {
  -webkit-appearance: textfield; /* 1 */
  outline-offset: -2px; /* 2 */
}

/*
Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to \`inherit\` in Safari.
*/

::-webkit-file-upload-button {
  -webkit-appearance: button; /* 1 */
  font: inherit; /* 2 */
}

/*
Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
Removes the default spacing and border for appropriate elements.
*/

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
Reset default styling for dialogs.
*/

dialog {
  padding: 0;
}

/*
Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

input::-moz-placeholder, textarea::-moz-placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

input::placeholder,
textarea::placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

/*
Set the default cursor for buttons.
*/

button,
[role="button"] {
  cursor: pointer;
}

/*
Make sure disabled buttons don't get the pointer cursor.
*/

:disabled {
  cursor: default;
}

/*
1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add \`vertical-align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */

[hidden]:where(:not([hidden="until-found"])) {
  display: none;
}
.\\!container {
  width: 100% !important;
}
.container {
  width: 100%;
}
@media (min-width: 640px) {

  .\\!container {
    max-width: 640px !important;
  }

  .container {
    max-width: 640px;
  }
}
@media (min-width: 768px) {

  .\\!container {
    max-width: 768px !important;
  }

  .container {
    max-width: 768px;
  }
}
@media (min-width: 1024px) {

  .\\!container {
    max-width: 1024px !important;
  }

  .container {
    max-width: 1024px;
  }
}
@media (min-width: 1280px) {

  .\\!container {
    max-width: 1280px !important;
  }

  .container {
    max-width: 1280px;
  }
}
@media (min-width: 1536px) {

  .\\!container {
    max-width: 1536px !important;
  }

  .container {
    max-width: 1536px;
  }
}
/* Composer: root container anchored to bottom*/
/* Composer: form wrapper */
.composer-form {
  position: relative;
  z-index: 1;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  max-width: 680px;
  flex-direction: column;
  border-radius: 8px;
  border-width: 1px;
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
    background: var(--app-input-secondary-background);
    border-color: var(--app-input-border);
    color: var(--app-input-foreground);
}
.composer-form:focus-within {
    /* match existing highlight behavior */
    border-color: var(--app-input-highlight);
    box-shadow: 0 1px 2px
      color-mix(in srgb, var(--app-input-highlight), transparent 80%);
  }
/* Composer: input editable area */
.composer-input {
    /* Use plain CSS for font-family inheritance; Tailwind has no \`font-inherit\` utility */
    position: relative;
    max-height: 200px;
    min-height: 1.5em;
    flex: 1 1 0%;
    -webkit-user-select: text;
       -moz-user-select: text;
            user-select: text;
    align-self: stretch;
    overflow-y: auto;
    overflow-x: hidden;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    border-radius: 0px;
    border-width: 0px;
    background-color: transparent;
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    padding-left: 0.875rem;
    padding-right: 0.875rem;
    outline: 2px solid transparent;
    outline-offset: 2px;
    font-family: inherit;
    font-size: var(--vscode-chat-font-size, 13px);
    color: var(--app-input-foreground);
  }
/* Show placeholder when truly empty OR when flagged as empty via data attribute.
     The data attribute is needed because some browsers insert a <br> in
     contentEditable, which breaks :empty matching. */
.composer-input:empty:before,
  .composer-input[data-empty='true']::before {
    content: attr(data-placeholder);
    color: var(--app-input-placeholder-foreground);
    pointer-events: none;
    position: absolute;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 28px);
  }
.composer-input:focus {
    outline: none;
  }
.composer-input:disabled,
  .composer-input[contenteditable='false'] {
    color: #999;
    cursor: not-allowed;
  }
/* Composer: actions row (more compact) */
.composer-actions {
  z-index: 1;
  display: flex;
  min-width: 0px;
  align-items: center;
  gap: 0.25rem;
    padding: 5px;
    color: var(--app-secondary-foreground);
    border-top: 0.5px solid var(--app-input-border);
}
/* Text button (icon + label) */
.btn-text-compact {
  display: inline-flex;
  min-width: 0px;
  flex-shrink: 1;
  cursor: pointer;
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  align-items: center;
  gap: 0.25rem;
  border-radius: 2px;
  border-width: 0px;
  background-color: transparent;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
  font-size: 0.85em;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
    color: var(--app-secondary-foreground);
}
.btn-text-compact--primary {
    color: var(--app-secondary-foreground);
    /* color: var(--app-primary-foreground); */
  }
.btn-text-compact:hover {
    background-color: var(--app-ghost-button-hover-background);
  }
.btn-text-compact:active:not(:disabled) {
    filter: brightness(1.1);
  }
.btn-text-compact > svg {
    height: 1em;
    width: 1em;
    flex-shrink: 0;
  }
.btn-text-compact > span {
    display: inline-block;
    min-width: 0;
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
@media screen and (max-width: 300px) {
    .btn-text-compact > svg {
      display: none;
    }
  }
/* Icon-only button, compact square (26x26) */
.btn-icon-compact {
  display: inline-flex;
  height: 26px;
  width: 26px;
  flex-shrink: 0;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border-width: 1px;
  border-color: transparent;
  background-color: transparent;
  padding: 0px;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
    color: var(--app-secondary-foreground);
}
.btn-icon-compact:hover {
    background-color: var(--app-ghost-button-hover-background);
  }
.btn-icon-compact > svg {
  height: 1rem;
  width: 1rem;
}
/* Active/primary state for icon button (e.g., Thinking on) */
.btn-icon-compact--active {
    background-color: var(--app-qwen-clay-button-orange);
    color: var(--app-qwen-ivory);
  }
.btn-icon-compact--active > svg {
    stroke: var(--app-qwen-ivory);
    fill: var(--app-qwen-ivory);
  }
.composer-overlay {
  position: absolute;
  inset: 0px;
  z-index: 0;
  border-radius: 8px;
    background: var(--app-input-background);
}
/* Optional: send button variant */
.btn-send-compact {
  display: inline-flex;
  height: 26px;
  width: 26px;
  flex-shrink: 0;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border-width: 1px;
  border-color: transparent;
  background-color: transparent;
  padding: 0px;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
    color: var(--app-secondary-foreground);
}
.btn-send-compact:hover {
    background-color: var(--app-ghost-button-hover-background);
  }
.btn-send-compact > svg {
  height: 1rem;
  width: 1rem;
}
.btn-send-compact {
  margin-left: auto;
}
.btn-send-compact:hover {
  --tw-brightness: brightness(1.1);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.btn-send-compact:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.btn-send-compact {
    background-color: var(--app-qwen-clay-button-orange);
    color: var(--app-qwen-ivory);
  }
/*
   * File path styling inside tool call content
   * Applies to: .toolcall-content-wrapper .file-link-path
   * - Use monospace editor font
   * - Slightly smaller size
   * - Link color
   * - Tighten top alignment and allow aggressive breaking for long paths
   */
.toolcall-content-wrapper .file-link-path {
    /* Tailwind utilities where possible */
    min-width: 0px;
    word-break: break-all;
    padding-top: 1px;
    font-size: 0.85em;
    /* Not covered by Tailwind defaults: use CSS vars / properties */
    font-family: var(--app-monospace-font-family);
    color: var(--app-link-color);
    overflow-wrap: anywhere;
  }
.pointer-events-none {
  pointer-events: none;
}
.\\!visible {
  visibility: visible !important;
}
.visible {
  visibility: visible;
}
.invisible {
  visibility: hidden;
}
.collapse {
  visibility: collapse;
}
.static {
  position: static;
}
.fixed {
  position: fixed;
}
.absolute {
  position: absolute;
}
.relative {
  position: relative;
}
.inset-0 {
  inset: 0px;
}
.inset-x-0 {
  left: 0px;
  right: 0px;
}
.bottom-0 {
  bottom: 0px;
}
.bottom-auto {
  bottom: auto;
}
.bottom-full {
  bottom: 100%;
}
.left-0 {
  left: 0px;
}
.left-1\\/2 {
  left: 50%;
}
.left-\\[12px\\] {
  left: 12px;
}
.left-\\[3px\\] {
  left: 3px;
}
.right-0 {
  right: 0px;
}
.top-0 {
  top: 0px;
}
.top-\\[-0\\.1em\\] {
  top: -0.1em;
}
.top-\\[10px\\] {
  top: 10px;
}
.top-\\[24px\\] {
  top: 24px;
}
.top-\\[3px\\] {
  top: 3px;
}
.z-50 {
  z-index: 50;
}
.z-\\[1000\\] {
  z-index: 1000;
}
.z-\\[1\\] {
  z-index: 1;
}
.z-\\[999\\] {
  z-index: 999;
}
.m-0 {
  margin: 0px;
}
.m-\\[2px\\] {
  margin: 2px;
}
.mx-1 {
  margin-left: 0.25rem;
  margin-right: 0.25rem;
}
.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-1 {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.my-medium {
  margin-top: 8px;
  margin-bottom: 8px;
}
.mb-0\\.5 {
  margin-bottom: 0.125rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-\\[2px\\] {
  margin-bottom: 2px;
}
.ml-3 {
  margin-left: 0.75rem;
}
.mr-1\\.5 {
  margin-right: 0.375rem;
}
.mr-2 {
  margin-right: 0.5rem;
}
.mt-1 {
  margin-top: 0.25rem;
}
.mt-\\[2px\\] {
  margin-top: 2px;
}
.box-border {
  box-sizing: border-box;
}
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.inline {
  display: inline;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
.h-1 {
  height: 0.25rem;
}
.h-1\\.5 {
  height: 0.375rem;
}
.h-4 {
  height: 1rem;
}
.h-5 {
  height: 1.25rem;
}
.h-8 {
  height: 2rem;
}
.h-\\[60px\\] {
  height: 60px;
}
.h-\\[80px\\] {
  height: 80px;
}
.h-\\[calc\\(100\\%-24px\\)\\] {
  height: calc(100% - 24px);
}
.h-full {
  height: 100%;
}
.max-h-\\[300px\\] {
  max-height: 300px;
}
.max-h-\\[50vh\\] {
  max-height: 50vh;
}
.max-h-\\[min\\(500px\\2c 50vh\\)\\] {
  max-height: min(500px,50vh);
}
.min-h-0 {
  min-height: 0px;
}
.min-h-\\[28px\\] {
  min-height: 28px;
}
.w-1\\.5 {
  width: 0.375rem;
}
.w-2\\.5 {
  width: 0.625rem;
}
.w-4 {
  width: 1rem;
}
.w-8 {
  width: 2rem;
}
.w-\\[60px\\] {
  width: 60px;
}
.w-\\[80px\\] {
  width: 80px;
}
.w-\\[min\\(400px\\2c calc\\(100vw-32px\\)\\)\\] {
  width: min(400px,calc(100vw - 32px));
}
.w-full {
  width: 100%;
}
.w-px {
  width: 1px;
}
.min-w-0 {
  min-width: 0px;
}
.min-w-1 {
  min-width: 0.25rem;
}
.min-w-\\[10px\\] {
  min-width: 10px;
}
.max-w-\\[300px\\] {
  max-width: 300px;
}
.max-w-\\[400px\\] {
  max-width: 400px;
}
.max-w-\\[50\\%\\] {
  max-width: 50%;
}
.max-w-full {
  max-width: 100%;
}
.max-w-md {
  max-width: 28rem;
}
.max-w-sm {
  max-width: 24rem;
}
.flex-1 {
  flex: 1 1 0%;
}
.flex-shrink-0 {
  flex-shrink: 0;
}
.shrink-0 {
  flex-shrink: 0;
}
.-translate-x-1\\/2 {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-y-1\\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-rotate-45 {
  --tw-rotate: -45deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.animate-\\[fadeIn_0\\.2s_ease-in\\] {
  animation: fadeIn 0.2s ease-in;
}
.animate-\\[typingPulse_1\\.4s_infinite_ease-in-out\\] {
  animation: typingPulse 1.4s infinite ease-in-out;
}
@keyframes completion-menu-enter {

  0% {
    opacity: 0;
    transform: translateY(4px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-completion-menu-enter {
  animation: completion-menu-enter 150ms ease-out both;
}
@keyframes slide-up {

  0% {
    transform: translateY(100%);
    opacity: 0;
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slide-up 200ms ease-out both;
}
@keyframes spin {

  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.cursor-\\[inherit\\] {
  cursor: inherit;
}
.cursor-pointer {
  cursor: pointer;
}
.cursor-text {
  cursor: text;
}
.select-none {
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.select-text {
  -webkit-user-select: text;
     -moz-user-select: text;
          user-select: text;
}
.list-none {
  list-style-type: none;
}
.appearance-none {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
}
.grid-cols-\\[80px_1fr\\] {
  grid-template-columns: 80px 1fr;
}
.grid-cols-\\[auto_1fr\\] {
  grid-template-columns: auto 1fr;
}
.flex-row {
  flex-direction: row;
}
.flex-col {
  flex-direction: column;
}
.items-start {
  align-items: flex-start;
}
.items-center {
  align-items: center;
}
.items-baseline {
  align-items: baseline;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.gap-0 {
  gap: 0px;
}
.gap-1 {
  gap: 0.25rem;
}
.gap-1\\.5 {
  gap: 0.375rem;
}
.gap-2 {
  gap: 0.5rem;
}
.gap-3 {
  gap: 0.75rem;
}
.gap-6 {
  gap: 1.5rem;
}
.gap-8 {
  gap: 2rem;
}
.gap-\\[2px\\] {
  gap: 2px;
}
.gap-\\[var\\(--app-list-gap\\)\\] {
  gap: var(--app-list-gap);
}
.gap-medium {
  gap: 8px;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-x-auto {
  overflow-x: auto;
}
.overflow-y-auto {
  overflow-y: auto;
}
.overflow-x-hidden {
  overflow-x: hidden;
}
.overflow-y-hidden {
  overflow-y: hidden;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.text-ellipsis {
  text-overflow: ellipsis;
}
.whitespace-normal {
  white-space: normal;
}
.whitespace-nowrap {
  white-space: nowrap;
}
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
.break-words {
  overflow-wrap: break-word;
}
.rounded {
  border-radius: 0.25rem;
}
.rounded-\\[2px\\] {
  border-radius: 2px;
}
.rounded-\\[4px\\] {
  border-radius: 4px;
}
.rounded-\\[var\\(--app-list-border-radius\\)\\] {
  border-radius: var(--app-list-border-radius);
}
.rounded-\\[var\\(--corner-radius-small\\)\\] {
  border-radius: var(--corner-radius-small);
}
.rounded-full {
  border-radius: 9999px;
}
.rounded-large {
  border-radius: 8px;
}
.rounded-lg {
  border-radius: 0.5rem;
}
.rounded-md {
  border-radius: 0.375rem;
}
.rounded-medium {
  border-radius: 6px;
}
.rounded-sm {
  border-radius: 0.125rem;
}
.rounded-small {
  border-radius: 4px;
}
.border {
  border-width: 1px;
}
.border-0 {
  border-width: 0px;
}
.border-b {
  border-bottom-width: 1px;
}
.border-b-2 {
  border-bottom-width: 2px;
}
.border-l-2 {
  border-left-width: 2px;
}
.border-none {
  border-style: none;
}
.border-\\[\\#74c991\\] {
  --tw-border-opacity: 1;
  border-color: rgb(116 201 145 / var(--tw-border-opacity, 1));
}
.border-\\[var\\(--app-input-border\\)\\] {
  border-color: var(--app-input-border);
}
.border-\\[var\\(--app-primary-border-color\\)\\] {
  border-color: var(--app-primary-border-color);
}
.bg-\\[\\#2196f3\\] {
  --tw-bg-opacity: 1;
  background-color: rgb(33 150 243 / var(--tw-bg-opacity, 1));
}
.bg-\\[\\#4caf50\\] {
  --tw-bg-opacity: 1;
  background-color: rgb(76 175 80 / var(--tw-bg-opacity, 1));
}
.bg-\\[\\#4f46e5\\] {
  --tw-bg-opacity: 1;
  background-color: rgb(79 70 229 / var(--tw-bg-opacity, 1));
}
.bg-\\[\\#f44336\\] {
  --tw-bg-opacity: 1;
  background-color: rgb(244 67 54 / var(--tw-bg-opacity, 1));
}
.bg-\\[\\#ffc107\\] {
  --tw-bg-opacity: 1;
  background-color: rgb(255 193 7 / var(--tw-bg-opacity, 1));
}
.bg-\\[var\\(--app-header-background\\)\\] {
  background-color: var(--app-header-background);
}
.bg-\\[var\\(--app-input-background\\)\\] {
  background-color: var(--app-input-background);
}
.bg-\\[var\\(--app-list-active-background\\)\\] {
  background-color: var(--app-list-active-background);
}
.bg-\\[var\\(--app-menu-background\\)\\] {
  background-color: var(--app-menu-background);
}
.bg-\\[var\\(--app-primary-background\\)\\] {
  background-color: var(--app-primary-background);
}
.bg-\\[var\\(--app-primary-border-color\\)\\] {
  background-color: var(--app-primary-border-color);
}
.bg-\\[var\\(--app-secondary-foreground\\)\\] {
  background-color: var(--app-secondary-foreground);
}
.bg-gray-200 {
  --tw-bg-opacity: 1;
  background-color: rgb(229 231 235 / var(--tw-bg-opacity, 1));
}
.bg-gray-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(107 114 128 / var(--tw-bg-opacity, 1));
}
.bg-transparent {
  background-color: transparent;
}
.bg-gradient-to-b {
  background-image: linear-gradient(to bottom, var(--tw-gradient-stops));
}
.from-transparent {
  --tw-gradient-from: transparent var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(0 0 0 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.to-\\[var\\(--app-primary-background\\)\\] {
  --tw-gradient-to: var(--app-primary-background) var(--tw-gradient-to-position);
}
.object-contain {
  -o-object-fit: contain;
     object-fit: contain;
}
.p-0 {
  padding: 0px;
}
.p-1 {
  padding: 0.25rem;
}
.p-2 {
  padding: 0.5rem;
}
.p-3 {
  padding: 0.75rem;
}
.p-5 {
  padding: 1.25rem;
}
.p-\\[var\\(--app-list-item-padding\\)\\] {
  padding: var(--app-list-item-padding);
}
.p-\\[var\\(--app-list-padding\\)\\] {
  padding: var(--app-list-padding);
}
.p-large {
  padding: 12px;
}
.p-medium {
  padding: 8px;
}
.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.px-2\\.5 {
  padding-left: 0.625rem;
  padding-right: 0.625rem;
}
.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.py-0 {
  padding-top: 0px;
  padding-bottom: 0px;
}
.py-0\\.5 {
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}
.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.py-1\\.5 {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.pb-1 {
  padding-bottom: 0.25rem;
}
.pb-2 {
  padding-bottom: 0.5rem;
}
.pb-4 {
  padding-bottom: 1rem;
}
.pb-\\[140px\\] {
  padding-bottom: 140px;
}
.pl-5 {
  padding-left: 1.25rem;
}
.pl-6 {
  padding-left: 1.5rem;
}
.pl-\\[30px\\] {
  padding-left: 30px;
}
.pr-2 {
  padding-right: 0.5rem;
}
.pr-5 {
  padding-right: 1.25rem;
}
.pt-5 {
  padding-top: 1.25rem;
}
.pt-\\[2px\\] {
  padding-top: 2px;
}
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.align-middle {
  vertical-align: middle;
}
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}
.text-\\[0\\.85em\\] {
  font-size: 0.85em;
}
.text-\\[0\\.9em\\] {
  font-size: 0.9em;
}
.text-\\[1\\.1em\\] {
  font-size: 1.1em;
}
.text-\\[11px\\] {
  font-size: 11px;
}
.text-\\[13px\\] {
  font-size: 13px;
}
.text-\\[14px\\] {
  font-size: 14px;
}
.text-\\[15px\\] {
  font-size: 15px;
}
.text-\\[16px\\] {
  font-size: 16px;
}
.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}
.font-\\[600\\] {
  font-weight: 600;
}
.font-\\[var\\(--vscode-chat-font-family\\)\\] {
  font-weight: var(--vscode-chat-font-family);
}
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.font-normal {
  font-weight: 400;
}
.font-semibold {
  font-weight: 600;
}
.italic {
  font-style: italic;
}
.leading-\\[1\\.5\\] {
  line-height: 1.5;
}
.leading-none {
  line-height: 1;
}
.leading-normal {
  line-height: 1.5;
}
.leading-relaxed {
  line-height: 1.625;
}
.text-\\[\\#c74e39\\] {
  --tw-text-opacity: 1;
  color: rgb(199 78 57 / var(--tw-text-opacity, 1));
}
.text-\\[\\#e1c08d\\] {
  --tw-text-opacity: 1;
  color: rgb(225 192 141 / var(--tw-text-opacity, 1));
}
.text-\\[var\\(--app-list-active-foreground\\)\\] {
  color: var(--app-list-active-foreground);
}
.text-\\[var\\(--app-menu-foreground\\)\\] {
  color: var(--app-menu-foreground);
}
.text-\\[var\\(--app-monospace-font-size\\)\\] {
  color: var(--app-monospace-font-size);
}
.text-\\[var\\(--app-primary-foreground\\)\\] {
  color: var(--app-primary-foreground);
}
.text-\\[var\\(--app-secondary-foreground\\)\\] {
  color: var(--app-secondary-foreground);
}
.text-\\[var\\(--vscode-chat-font-size\\2c 13px\\)\\] {
  color: var(--vscode-chat-font-size,13px);
}
.text-\\[var\\(--vscode-symbolIcon-fileForeground\\2c \\#cccccc\\)\\] {
  color: var(--vscode-symbolIcon-fileForeground,#cccccc);
}
.text-qwen-error {
  --tw-text-opacity: 1;
  color: rgb(199 78 57 / var(--tw-text-opacity, 1));
}
.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}
.line-through {
  text-decoration-line: line-through;
}
.no-underline {
  text-decoration-line: none;
}
.opacity-50 {
  opacity: 0.5;
}
.opacity-60 {
  opacity: 0.6;
}
.opacity-70 {
  opacity: 0.7;
}
.opacity-80 {
  opacity: 0.8;
}
.opacity-85 {
  opacity: 0.85;
}
.opacity-90 {
  opacity: 0.9;
}
.shadow-\\[0_4px_16px_rgba\\(0\\2c 0\\2c 0\\2c 0\\.1\\)\\] {
  --tw-shadow: 0 4px 16px rgba(0,0,0,0.1);
  --tw-shadow-colored: 0 4px 16px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-\\[inset_0_0_0_1px_var\\(--app-transparent-inner-border\\)\\] {
  --tw-shadow: inset 0 0 0 1px var(--app-transparent-inner-border);
  --tw-shadow-colored: inset 0 0 0 1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-sm {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.outline-none {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.ring {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.backdrop-blur-sm {
  --tw-backdrop-blur: blur(4px);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.duration-100 {
  transition-duration: 100ms;
}
.duration-150 {
  transition-duration: 150ms;
}
.duration-200 {
  transition-duration: 200ms;
}
.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
/* Multi-line clamp with ellipsis (Chromium-based webview supported) */
.q-line-clamp-3 {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }
.\\[animation-delay\\:0\\.2s\\] {
  animation-delay: 0.2s;
}
.\\[animation-delay\\:0\\.4s\\] {
  animation-delay: 0.4s;
}
.\\[animation-delay\\:0s\\] {
  animation-delay: 0s;
}

/* ===========================
   Reusable Component Classes
   =========================== */

/* ===========================
   Utilities
   =========================== */

.placeholder\\:text-\\[var\\(--app-input-placeholder-foreground\\)\\]::-moz-placeholder {
  color: var(--app-input-placeholder-foreground);
}

.placeholder\\:text-\\[var\\(--app-input-placeholder-foreground\\)\\]::placeholder {
  color: var(--app-input-placeholder-foreground);
}

.placeholder\\:opacity-60::-moz-placeholder {
  opacity: 0.6;
}

.placeholder\\:opacity-60::placeholder {
  opacity: 0.6;
}

.placeholder\\:opacity-70::-moz-placeholder {
  opacity: 0.7;
}

.placeholder\\:opacity-70::placeholder {
  opacity: 0.7;
}

.before\\:absolute::before {
  content: var(--tw-content);
  position: absolute;
}

.before\\:left-\\[8px\\]::before {
  content: var(--tw-content);
  left: 8px;
}

.before\\:top-2::before {
  content: var(--tw-content);
  top: 0.5rem;
}

.before\\:z-\\[1\\]::before {
  content: var(--tw-content);
  z-index: 1;
}

@keyframes pulse-slow {

  0%, 100% {
    content: var(--tw-content);
    opacity: 1;
  }

  50% {
    content: var(--tw-content);
    opacity: 0.5;
  }
}

.before\\:animate-pulse-slow::before {
  content: var(--tw-content);
  animation: pulse-slow 1.5s ease-in-out infinite;
}

.before\\:text-\\[10px\\]::before {
  content: var(--tw-content);
  font-size: 10px;
}

.before\\:text-qwen-error::before {
  content: var(--tw-content);
  --tw-text-opacity: 1;
  color: rgb(199 78 57 / var(--tw-text-opacity, 1));
}

.before\\:text-qwen-loading::before {
  content: var(--tw-content);
  color: var(--app-secondary-foreground);
}

.before\\:text-qwen-success::before {
  content: var(--tw-content);
  --tw-text-opacity: 1;
  color: rgb(116 201 145 / var(--tw-text-opacity, 1));
}

.before\\:text-qwen-warning::before {
  content: var(--tw-content);
  --tw-text-opacity: 1;
  color: rgb(225 192 141 / var(--tw-text-opacity, 1));
}

.before\\:opacity-70::before {
  content: var(--tw-content);
  opacity: 0.7;
}

.before\\:content-\\[\\"\\\\\\\\25cf\\"\\]::before {
  --tw-content: "\\\\25cf";
  content: var(--tw-content);
}

.hover\\:relative:hover {
  position: relative;
}

.hover\\:border-0:hover {
  border-width: 0px;
}

.hover\\:bg-\\[\\#4338ca\\]:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(67 56 202 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-\\[var\\(--app-button-background\\)\\]:hover {
  background-color: var(--app-button-background);
}

.hover\\:bg-\\[var\\(--app-ghost-button-hover-background\\)\\]:hover {
  background-color: var(--app-ghost-button-hover-background);
}

.hover\\:bg-\\[var\\(--app-list-hover-background\\)\\]:hover {
  background-color: var(--app-list-hover-background);
}

.hover\\:font-bold:hover {
  font-weight: 700;
}

.hover\\:text-\\[var\\(--app-button-foreground\\)\\]:hover {
  color: var(--app-button-foreground);
}

.hover\\:text-\\[var\\(--app-primary-foreground\\)\\]:hover {
  color: var(--app-primary-foreground);
}

.hover\\:underline:hover {
  text-decoration-line: underline;
}

.hover\\:no-underline:hover {
  text-decoration-line: none;
}

.focus\\:rounded-\\[2px\\]:focus {
  border-radius: 2px;
}

.focus\\:bg-\\[var\\(--app-ghost-button-hover-background\\)\\]:focus {
  background-color: var(--app-ghost-button-hover-background);
}

.focus\\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus\\:outline:focus {
  outline-style: solid;
}

.focus\\:outline-1:focus {
  outline-width: 1px;
}

.focus\\:outline-offset-2:focus {
  outline-offset: 2px;
}

.focus\\:outline-\\[var\\(--vscode-focusBorder\\)\\]:focus {
  outline-color: var(--vscode-focusBorder);
}

.active\\:opacity-80:active {
  opacity: 0.8;
}

@media (min-width: 640px) {

  .sm\\:inline {
    display: inline;
  }
}

@media (min-width: 768px) {

  .md\\:p-10 {
    padding: 2.5rem;
  }
}

@media (prefers-color-scheme: dark) {

  .dark\\:opacity-60 {
    opacity: 0.6;
  }
}

.\\[\\&\\:\\:-webkit-scrollbar-thumb\\]\\:rounded-sm::-webkit-scrollbar-thumb {
  border-radius: 0.125rem;
}

.\\[\\&\\:\\:-webkit-scrollbar-thumb\\]\\:bg-white\\/20::-webkit-scrollbar-thumb {
  background-color: rgb(255 255 255 / 0.2);
}

.\\[\\&\\:\\:-webkit-scrollbar-thumb\\]\\:hover\\:bg-white\\/30:hover::-webkit-scrollbar-thumb {
  background-color: rgb(255 255 255 / 0.3);
}

.\\[\\&\\:\\:-webkit-scrollbar-track\\]\\:bg-transparent::-webkit-scrollbar-track {
  background-color: transparent;
}

.\\[\\&\\:\\:-webkit-scrollbar\\]\\:w-2::-webkit-scrollbar {
  width: 0.5rem;
}

.\\[\\&\\:not\\(\\:first-child\\)\\]\\:mt-2:not(:first-child) {
  margin-top: 0.5rem;
}

.\\[\\&\\>\\*\\:not\\(\\:last-child\\)\\]\\:pb-\\[8px\\]>*:not(:last-child) {
  padding-bottom: 8px;
}

.\\[\\&\\>\\*\\]\\:relative>* {
  position: relative;
}

.\\[\\&\\>\\*\\]\\:flex>* {
  display: flex;
}

.\\[\\&\\>\\*\\]\\:animate-\\[fadeIn_0\\.2s_ease-in\\]>* {
  animation: fadeIn 0.2s ease-in;
}

.\\[\\&\\>\\*\\]\\:flex-col>* {
  flex-direction: column;
}

.\\[\\&\\>\\*\\]\\:items-start>* {
  align-items: flex-start;
}

.\\[\\&\\>\\*\\]\\:gap-0>* {
  gap: 0px;
}

.\\[\\&\\>\\*\\]\\:py-2>* {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.\\[\\&\\>\\*\\]\\:text-left>* {
  text-align: left;
}

.\\[\\&\\>svg\\]\\:h-5>svg {
  height: 1.25rem;
}

.\\[\\&\\>svg\\]\\:w-5>svg {
  width: 1.25rem;
}
`;document.head.appendChild(I1);var M1=document.createElement("style");M1.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/* ===========================
   CSS Variables (Root Level)
   =========================== */
:root {
  /* Qwen Brand Colors */
  --app-qwen-theme: #615fff;
  --app-qwen-clay-button-orange: #4f46e5;
  --app-qwen-ivory: #f5f5ff;
  --app-qwen-slate: #141420;
  --app-qwen-green: #6bcf7f;

  /* Spacing */
  --app-spacing-small: 4px;
  --app-spacing-medium: 8px;
  --app-spacing-large: 12px;
  --app-spacing-xlarge: 16px;

  /* Border Radius */
  --corner-radius-small: 4px;
  --corner-radius-medium: 6px;
  --corner-radius-large: 8px;

  /* Typography */
  --app-monospace-font-family: var(--vscode-editor-font-family, monospace);
  --app-monospace-font-size: var(--vscode-editor-font-size, 12px);

  /* Foreground & Background */
  --app-primary-foreground: var(--vscode-foreground);
  --app-primary-background: var(--vscode-sideBar-background);
  --app-primary-border-color: var(--vscode-sideBarActivityBarTop-border);
  --app-secondary-foreground: var(--vscode-descriptionForeground);

  /* Input Colors */
  --app-input-foreground: var(--vscode-input-foreground);
  --app-input-background: var(--vscode-input-background);
  --app-input-border: var(--vscode-inlineChatInput-border);
  --app-input-active-border: var(--vscode-inputOption-activeBorder);
  --app-input-placeholder-foreground: var(--vscode-input-placeholderForeground);
  --app-input-secondary-background: var(--vscode-menu-background);
  /* Input Highlight (focus ring/border) */
  --app-input-highlight: var(--app-qwen-theme);

  /* Code Highlighting */
  --app-code-background: var(
    --vscode-textCodeBlock-background,
    rgba(0, 0, 0, 0.05)
  );
  --app-link-foreground: var(--vscode-textLink-foreground, #007acc);
  --app-link-active-foreground: var(
    --vscode-textLink-activeForeground,
    #005a9e
  );

  /* List Styles */
  --app-list-hover-background: var(--vscode-list-hoverBackground);
  --app-list-active-background: var(--vscode-list-activeSelectionBackground);
  --app-list-active-foreground: var(--vscode-list-activeSelectionForeground);

  /* Buttons */
  --app-ghost-button-hover-background: var(--vscode-toolbar-hoverBackground);
  --app-button-foreground: var(--vscode-button-foreground);
  --app-button-background: var(--vscode-button-background);
  --app-button-hover-background: var(--vscode-button-hoverBackground);

  /* Border Transparency */
  --app-transparent-inner-border: rgba(255, 255, 255, 0.1);

  /* Header */
  --app-header-background: var(--vscode-sideBar-background);

  /* List Styles*/
  --app-list-padding: 0px;
  --app-list-item-padding: 4px 8px;
  --app-list-border-color: transparent;
  --app-list-border-radius: 4px;
  --app-list-gap: 2px;

  /* Menu Colors*/
  --app-menu-background: var(--vscode-menu-background);
  --app-menu-border: var(--vscode-menu-border);
  --app-menu-foreground: var(--vscode-menu-foreground);
  --app-menu-selection-background: var(--vscode-menu-selectionBackground);
  --app-menu-selection-foreground: var(--vscode-menu-selectionForeground);

  /* Modal */
  --app-modal-background: rgba(0, 0, 0, 0.75);

  /* Widget */
  --app-widget-border: var(--vscode-editorWidget-border);
  --app-widget-shadow: var(--vscode-widget-shadow);
}

/* Light Theme Overrides */
.vscode-light {
  --app-transparent-inner-border: rgba(0, 0, 0, 0.07);
  /* Slightly different brand shade in light theme for better contrast */
  --app-input-highlight: var(--app-qwen-clay-button-orange);
}

/* Icon SVG styles */
.icon-svg {
  display: block;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--vscode-chat-font-family, var(--vscode-font-family));
  background-color: var(--app-primary-background);
  color: var(--app-primary-foreground);
  overflow: hidden;
  font-size: var(--vscode-chat-font-size, 13px);
  padding: 0;
}

/* Ensure tool call containers keep a consistent left indent even if Tailwind utilities are purged */
.toolcall-container {
  /* Consistent indent for tool call blocks */
  padding-left: 30px;
}

.toolcall-card {
  /* Consistent indent for card-style tool calls */
  padding-left: 30px;
}

button {
  color: var(--app-primary-foreground);
  font-family: var(--vscode-chat-font-family);
  font-size: var(--vscode-chat-font-size, 13px);
}

/* ===========================
   Main Chat Container
   =========================== */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--app-primary-background);
  color: var(--app-primary-foreground);
}

/* Message list container: prevent browser scroll anchoring from fighting our manual pin-to-bottom logic */
.chat-messages > * {
  /* Disable overflow anchoring on individual items so the UA doesn't auto-adjust scroll */
  overflow-anchor: none;
}

/* ===========================
   Animations (used by message components)
   =========================== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes typingPulse {
  0%,
  60%,
  100% {
    transform: scale(0.7);
    opacity: 0.6;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ===========================
   Input Form Styles
   =========================== */
.input-form {
  display: flex;
  background-color: var(--app-primary-background);
  border-top: 1px solid var(--app-primary-border-color);
}

.input-field {
  flex: 1;
  padding: 10px 12px;
  background-color: var(--app-input-background);
  color: var(--app-input-foreground);
  border: 1px solid var(--app-input-border);
  border-radius: var(--corner-radius-small);
  font-size: var(--vscode-chat-font-size, 13px);
  font-family: var(--vscode-chat-font-family);
  outline: none;
  line-height: 1.5;
}

.input-field:focus {
  border-color: var(--app-qwen-theme);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-field::-moz-placeholder {
  color: var(--app-input-placeholder-foreground);
}

.input-field::placeholder {
  color: var(--app-input-placeholder-foreground);
}

.send-button {
  padding: 10px 20px;
  background-color: var(--app-qwen-clay-button-orange);
  color: var(--app-qwen-ivory);
  border: none;
  border-radius: var(--corner-radius-small);
  font-size: var(--vscode-chat-font-size, 13px);
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.send-button:active:not(:disabled) {
  filter: brightness(0.9);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animation for in-progress status (used by pseudo bullets and spinners) */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.code-block {
  font-family: var(--app-monospace-font-family);
  font-size: var(--app-monospace-font-size);
  background: var(--app-primary-background);
  border: 1px solid var(--app-input-border);
  border-radius: var(--corner-radius-small);
  padding: var(--app-spacing-medium);
  overflow-x: auto;
  margin: 4px 0 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

/* ===========================
   Diff Display Styles
   =========================== */
.diff-display-container {
  margin: 8px 0;
  border: 1px solid var(--app-input-border);
  border-radius: var(--corner-radius-medium);
  overflow: hidden;
}

.diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--app-input-secondary-background);
  border-bottom: 1px solid var(--app-input-border);
}

.diff-file-path {
  font-family: var(--app-monospace-font-family);
  font-size: 13px;
  color: var(--app-primary-foreground);
}

.open-diff-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--app-input-border);
  border-radius: var(--corner-radius-small);
  color: var(--app-primary-foreground);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.15s;
}

.open-diff-button:hover {
  background: var(--app-ghost-button-hover-background);
}

.open-diff-button svg {
  width: 16px;
  height: 16px;
}

.diff-section {
  margin: 0;
}

.diff-label {
  padding: 8px 12px;
  background: var(--app-primary-background);
  border-bottom: 1px solid var(--app-input-border);
  font-size: 11px;
  font-weight: 600;
  color: var(--app-secondary-foreground);
  text-transform: uppercase;
}

.diff-section .code-block {
  border: none;
  border-radius: 0;
  margin: 0;
  max-height: none; /* Remove height limit for diffs */
  overflow-y: visible;
}

.diff-section .code-content {
  display: block;
}

/* ===========================
   Permission Request Card Styles
   =========================== */
.permission-request-card {
  background: var(--app-input-background);
  border: 1px solid var(--app-qwen-theme);
  border-radius: var(--corner-radius-medium);
  margin: var(--app-spacing-medium) 0;
  margin-bottom: var(--app-spacing-xlarge);
  overflow: visible;
  animation: fadeIn 0.2s ease-in;
}

.permission-card-body {
  padding: var(--app-spacing-large);
  min-height: -moz-fit-content;
  min-height: fit-content;
  height: auto;
}

.permission-header {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-large);
  margin-bottom: var(--app-spacing-large);
}

.permission-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(97, 95, 255, 0.1);
  border-radius: var(--corner-radius-medium);
  flex-shrink: 0;
}

.permission-icon {
  font-size: 20px;
}

.permission-info {
  flex: 1;
  min-width: 0;
}

.permission-title {
  font-weight: 600;
  color: var(--app-primary-foreground);
  margin-bottom: 2px;
}

.permission-subtitle {
  font-size: 12px;
  color: var(--app-secondary-foreground);
}

.permission-command-section {
  margin-bottom: var(--app-spacing-large);
}

.permission-command-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--app-secondary-foreground);
  margin-bottom: var(--app-spacing-small);
  text-transform: uppercase;
}

.permission-command-code {
  display: block;
  font-family: var(--app-monospace-font-family);
  font-size: var(--app-monospace-font-size);
  color: var(--app-primary-foreground);
  background: var(--app-primary-background);
  padding: var(--app-spacing-medium);
  border-radius: var(--corner-radius-small);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.permission-locations-section {
  margin-bottom: var(--app-spacing-large);
}

.permission-locations-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--app-secondary-foreground);
  margin-bottom: var(--app-spacing-small);
  text-transform: uppercase;
}

.permission-location-item {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-small);
  padding: var(--app-spacing-small) 0;
  font-size: 12px;
}

.permission-location-icon {
  flex-shrink: 0;
}

.permission-location-path {
  color: var(--app-primary-foreground);
  font-family: var(--app-monospace-font-family);
}

.permission-location-line {
  color: var(--app-secondary-foreground);
}

.permission-options-section {
  margin-top: var(--app-spacing-large);
}

.permission-options-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-primary-foreground);
  margin-bottom: var(--app-spacing-medium);
}

.permission-options-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-spacing-small);
}

.permission-option {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-medium);
  padding: var(--app-spacing-medium) var(--app-spacing-large);
  background: var(--app-primary-background);
  border: 1px solid var(--app-input-border);
  border-radius: var(--corner-radius-small);
  cursor: pointer;
  transition: all 0.15s ease;
}

.permission-option:hover {
  background: var(--app-list-hover-background);
  border-color: var(--app-input-active-border);
}

.permission-option.selected {
  border-color: var(--app-qwen-theme);
  background: rgba(97, 95, 255, 0.1);
}

.permission-radio {
  flex-shrink: 0;
}

.permission-option-content {
  display: flex;
  align-items: center;
  gap: var(--app-spacing-small);
  flex: 1;
}

.permission-option-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--app-secondary-foreground);
  background-color: var(--app-list-hover-background);
  border-radius: 4px;
  margin-right: 4px;
}

.permission-option.selected .permission-option-number {
  color: var(--app-qwen-ivory);
  background-color: var(--app-qwen-theme);
}

.permission-always-badge {
  font-size: 12px;
}

.permission-no-options {
  text-align: center;
  padding: var(--app-spacing-large);
  color: var(--app-secondary-foreground);
}

.permission-actions {
  margin-top: var(--app-spacing-large);
  display: flex;
  justify-content: flex-end;
}

.permission-confirm-button {
  padding: var(--app-spacing-medium) var(--app-spacing-xlarge);
  background: var(--app-qwen-clay-button-orange);
  color: var(--app-qwen-ivory);
  border: none;
  border-radius: var(--corner-radius-small);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.permission-confirm-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.permission-confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-spacing-medium);
  padding: var(--app-spacing-large);
  background: rgba(76, 175, 80, 0.1);
  border-radius: var(--corner-radius-small);
  margin-top: var(--app-spacing-large);
}

.permission-success-icon {
  color: #4caf50;
  font-weight: bold;
}

.permission-success-text {
  color: #4caf50;
  font-size: 13px;
}
`;document.head.appendChild(M1);var P1=document.createElement("style");P1.textContent=`/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/* Import component styles */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified timeline styles for tool calls and messages
 */

/* ==========================================
   ToolCallContainer timeline styles
   ========================================== */
.toolcall-container {
  position: relative;
  padding-left: 30px;
  padding-top: 8px;
  padding-bottom: 8px;
}

/* ToolCallContainer timeline connector */
.toolcall-container::after {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--app-primary-border-color);
}

/* First item: connector starts from status point position */
.toolcall-container:first-child::after {
  top: 24px;
}

/* Last item: connector shows only upper part */
.toolcall-container:last-child::after {
  height: calc(100% - 24px);
  top: 0;
  bottom: auto;
}

/* ==========================================
   AssistantMessage timeline styles
   ========================================== */
.assistant-message-container {
  position: relative;
  padding-left: 30px;
  padding-top: 8px;
  padding-bottom: 8px;
}

/* AssistantMessage timeline connector */
.assistant-message-container::after {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--app-primary-border-color);
}

/* First item: connector starts from status point position */
.assistant-message-container:first-child::after {
  top: 24px;
}

/* Last item: connector shows only upper part */
.assistant-message-container:last-child::after {
  height: calc(100% - 24px);
  top: 0;
  bottom: auto;
}

/* ==========================================
   Custom timeline styles for qwen-message message-item elements
   ========================================== */

/* Default connector style - creates full-height connectors for all AI message items */
.qwen-message.message-item:not(.user-message-container)::after {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--app-primary-border-color);
  z-index: 0;
}

/* Single-item AI sequence (both a start and an end): hide the connector entirely */
.qwen-message.message-item:not(.user-message-container):is(
    :first-child,
    .user-message-container
      + .qwen-message.message-item:not(.user-message-container),
    .chat-messages
      > :not(.qwen-message.message-item)
      + .qwen-message.message-item:not(.user-message-container)
  ):is(
    :has(+ .user-message-container),
    :has(+ :not(.qwen-message.message-item)),
    :last-child
  )::after {
  display: none;
}

/* Handle the start of each AI message sequence - includes the first AI message in the entire message list and new AI messages interrupted by user messages */
.qwen-message.message-item:not(.user-message-container):first-child::after,
.user-message-container + .qwen-message.message-item:not(.user-message-container)::after,
/* If the previous sibling is not .qwen-message.message-item (such as waiting prompts, sentinel elements, or card-style tool calls), also treat as a new group start */
.chat-messages > :not(.qwen-message.message-item)
  + .qwen-message.message-item:not(.user-message-container)::after {
  top: 15px;
}

/* Handle the end of each AI message sequence */
/* When the next sibling is a user message */
.qwen-message.message-item:not(.user-message-container):has(+ .user-message-container)::after,
/* Or when the next sibling is not .qwen-message.message-item (such as waiting prompts, sentinel elements, card-style tool calls, etc.) */
.qwen-message.message-item:not(.user-message-container):has(+ :not(.qwen-message.message-item))::after,
/* When it's truly the last child element of the parent container */
.qwen-message.message-item:not(.user-message-container):last-child::after {
  /* Note: When setting both top and bottom, the height is (container height - top - bottom).
   * Here we expect "15px spacing at the bottom", so bottom should be 15px (not calc(100% - 15px)). */
  top: 0;
  bottom: calc(100% - 15px);
}

.user-message-container:first-child {
  margin-top: 0;
}

.message-item {
  padding: 8px 0;
  width: 100%;
  align-items: flex-start;
  padding-left: 30px;
  -webkit-user-select: text;
     -moz-user-select: text;
          user-select: text;
  position: relative;
  padding-top: 8px;
  padding-bottom: 8px;
}

/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Styles for MarkdownRenderer component
 */

.markdown-content {
  /* Base styles for markdown content */
  line-height: 1.6;
  color: var(--app-primary-foreground);
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h1 {
  font-size: 1.75em;
  border-bottom: 1px solid var(--app-primary-border-color);
  padding-bottom: 0.3em;
}

.markdown-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--app-primary-border-color);
  padding-bottom: 0.3em;
}

.markdown-content h3 {
  font-size: 1.25em;
}

.markdown-content h4 {
  font-size: 1.1em;
}

.markdown-content h5,
.markdown-content h6 {
  font-size: 1em;
}

.markdown-content p {
  margin-top: 0;
  /* margin-bottom: 1em; */
}

.markdown-content ul,
.markdown-content ol {
  margin-top: 1em;
  margin-bottom: 1em;
  padding-left: 2em;
}

/* Ensure list markers are visible even with global CSS resets */
.markdown-content ul {
  list-style-type: disc;
  list-style-position: outside;
}

.markdown-content ol {
  list-style-type: decimal;
  list-style-position: outside;
}

/* Nested list styles */
.markdown-content ul ul {
  list-style-type: circle;
}

.markdown-content ul ul ul {
  list-style-type: square;
}

.markdown-content ol ol {
  list-style-type: lower-alpha;
}

.markdown-content ol ol ol {
  list-style-type: lower-roman;
}

/* Style the marker explicitly so themes don't hide it */
.markdown-content li::marker {
  color: var(--app-secondary-foreground);
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content li > p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-content blockquote {
  margin: 0 0 1em;
  padding: 0 1em;
  border-left: 0.25em solid var(--app-primary-border-color);
  color: var(--app-secondary-foreground);
}

.markdown-content a {
  color: var(--app-link-foreground, #007acc);
  text-decoration: none;
}

.markdown-content a:hover {
  color: var(--app-link-active-foreground, #005a9e);
  text-decoration: underline;
}

.markdown-content code {
  font-family: var(
    --app-monospace-font-family,
    'SF Mono',
    Monaco,
    'Cascadia Code',
    'Roboto Mono',
    Consolas,
    'Courier New',
    monospace
  );
  font-size: 0.9em;
  background-color: var(--app-code-background, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--app-primary-border-color);
  border-radius: var(--corner-radius-small, 4px);
  padding: 0.2em 0.4em;
  white-space: pre-wrap; /* Support automatic line wrapping */
  word-break: break-word; /* Break words when necessary */
}

.markdown-content pre {
  margin: 1em 0;
  padding: 1em;
  overflow-x: auto;
  background-color: var(--app-code-background, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--app-primary-border-color);
  border-radius: var(--corner-radius-small, 4px);
  font-family: var(
    --app-monospace-font-family,
    'SF Mono',
    Monaco,
    'Cascadia Code',
    'Roboto Mono',
    Consolas,
    'Courier New',
    monospace
  );
  font-size: 0.9em;
  line-height: 1.5;
}

.markdown-content pre code {
  background: none;
  border: none;
  padding: 0;
  white-space: pre-wrap; /* Support automatic line wrapping */
  word-break: break-word; /* Break words when necessary */
}

.markdown-content .file-path-link {
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(
    --app-monospace-font-family,
    'SF Mono',
    Monaco,
    'Cascadia Code',
    'Roboto Mono',
    Consolas,
    'Courier New',
    monospace
  );
  font-size: 0.95em;
  color: var(--app-link-foreground, #007acc);
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.1s ease;
}

.markdown-content .file-path-link:hover {
  color: var(--app-link-active-foreground, #005a9e);
}

.markdown-content hr {
  border: none;
  border-top: 1px solid var(--app-primary-border-color);
  margin: 1.5em 0;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-content th,
.markdown-content td {
  padding: 0.5em 1em;
  border: 1px solid var(--app-primary-border-color);
  text-align: left;
}

.markdown-content th {
  background-color: var(--app-secondary-background);
  font-weight: 600;
}


/* ===========================
   CSS Variables
   =========================== */
:root {
  /* Colors */
  --app-primary-foreground: var(--vscode-foreground);
  --app-secondary-foreground: var(--vscode-descriptionForeground);
  --app-primary-border-color: var(--vscode-panel-border);
  --app-input-placeholder-foreground: var(--vscode-input-placeholderForeground);

  /* Buttons */
  --app-ghost-button-hover-background: var(--vscode-toolbar-hoverBackground);

  /* Border Radius */
  --corner-radius-small: 6px;

  /* Header */
  --app-header-background: var(--vscode-sideBar-background);

  /* List Styles */
  --app-list-padding: 0px;
  --app-list-item-padding: 4px 8px;
  --app-list-border-color: transparent;
  --app-list-border-radius: 4px;
  --app-list-hover-background: var(--vscode-list-hoverBackground);
  --app-list-active-background: var(--vscode-list-activeSelectionBackground);
  --app-list-active-foreground: var(--vscode-list-activeSelectionForeground);
  --app-list-gap: 2px;

  /* Menu Styles */
  --app-menu-background: var(--vscode-menu-background);
  --app-menu-border: var(--vscode-menu-border);
  --app-menu-foreground: var(--vscode-menu-foreground);
  --app-menu-selection-background: var(--vscode-menu-selectionBackground);
  --app-menu-selection-foreground: var(--vscode-menu-selectionForeground);

  /* Tool Call Styles */
  --app-tool-background: var(--vscode-editor-background);
  --app-code-background: var(--vscode-textCodeBlock-background);

  /* Warning/Error Styles */
  --app-warning-background: var(
    --vscode-editorWarning-background,
    rgba(255, 204, 0, 0.1)
  );
  --app-warning-border: var(--vscode-editorWarning-foreground, #ffcc00);
  --app-warning-foreground: var(--vscode-editorWarning-foreground, #ffcc00);
}
`;document.head.appendChild(P1);var O1=A(D(),1);var L1=document.getElementById("root");L1&&z1.default.createRoot(L1).render((0,O1.jsx)(R1,{}));})();
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared utility functions for tool call components
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * FileLink component - Clickable file path links
 * Supports clicking to open files and jump to specified line and column numbers
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared layout components for tool call UI
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic tool call component - handles all tool call types as fallback
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared utilities for handling diff operations in the webview
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Read tool call component - specialized for file reading operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Write tool call component - specialized for file writing operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Edit tool call component - specialized for file editing operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Temporary file manager for creating and opening temporary files in webview
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Execute tool call component - specialized for command execution operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * UpdatedPlan tool call component - specialized for plan update operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Search tool call component - specialized for search operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Think tool call component - specialized for thinking/reasoning operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tool call component factory - routes to specialized components by kind
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main ToolCall component - uses factory pattern to route to specialized components
 *
 * This file serves as the public API for tool call rendering.
 * It re-exports the router and types from the toolcalls module.
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * File and document related icons
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Navigation and action icons
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Edit mode related icons
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Status and state related icons
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Special UI icons
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Stop icon for canceling operations
 */
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * MarkdownRenderer component - renders markdown content with syntax highlighting and clickable file paths
 */
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
