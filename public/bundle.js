(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('@vue/composition-api'), require('typed.js')) :
    typeof define === 'function' && define.amd ? define(['@vue/composition-api', 'typed.js'], factory) :
    (global = global || self, factory(global.vueCompositionApi, global.Typed));
}(this, (function (VueCompositionApi, Typed) { 'use strict';

    var VueCompositionApi__default = 'default' in VueCompositionApi ? VueCompositionApi['default'] : VueCompositionApi;
    Typed = Typed && Object.prototype.hasOwnProperty.call(Typed, 'default') ? Typed['default'] : Typed;

    // type postDataOptions = {
    // 	responseType?: string
    // }
    // const defaultOptions: postDataOptions = {
    // 	responseType: 'json'
    // }
    const postData = async (url, data) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response;
    };
    postData.text = async (url, data) => {
        return (await postData(url, data)).text();
    };
    postData.json = async (url, data) => {
        return (await postData(url, data)).json();
    };

    class State {
        constructor() {
            this.text = '';
            this.curText = '';
            this.backgroundImageChanged = false;
        }
        get backgroundImage() {
            return this._backgroundImage || '/transparent.png';
        }
        set backgroundImage(s) {
            this._backgroundImage = s;
            this.backgroundImageChanged = true;
        }
        applyText(s) {
            this.text += this.curText;
            this.curText = s;
        }
    }
    const opsType = {};
    const ops = {};
    ops['\\char'] = async (engine, argv) => {
        if (argv.length > 1)
            engine.state.char = argv[1];
        else
            engine.state.char = undefined;
        await ops['\\clear'](engine, []);
        return false;
    };
    ops['\\background-image'] = async (engine, argv) => {
        engine.state.backgroundImage = argv[1];
        return false;
    };
    ops['\\newline'] = async (engine, argv) => {
        engine.state.curText += '<br/>';
        return false;
    };
    ops['\\clear'] = async (engine, argv) => {
        engine.state.text = engine.state.curText = '';
        return Boolean(argv[1]);
    };
    opsType['\\text'] = 1;
    ops['\\text'] = async (engine, argv) => {
        engine.state.applyText(argv[1]);
        return true;
    };
    ops['\\goto'] = async (engine, argv) => {
        await engine.selectSection(argv[1]);
        return false;
    };
    ops['\\query'] = async (engine, argv) => {
        engine.state.qid = argv[1];
        engine.state.qry = await engine.loadSection(argv[1]);
        return true;
    };
    ops['\\options'] = async (engine, argv) => {
        engine.state.qid = argv[1];
        engine.state.opts = (await engine.loadSection(argv[1])).split('\n');
        return true;
    };
    opsType['\\script'] = 1;
    ops['\\script'] = async (engine, argv) => {
        void (new Function(argv[1])).call(engine);
        return false;
    };
    ops['\\beginscript'] = async (engine, argv) => {
        const code = [];
        let line;
        while ((line = engine.nextLine()) !== '\\endscript')
            code.push(line);
        void (new Function(code.join('\n'))).call(engine);
        return false;
    };
    class Engine {
        constructor(gameName) {
            this.cnt = 0;
            this.cnt1 = 0;
            this.lst = [];
            this.lst1 = [];
            this.ans = {};
            this.data = {};
            this.gameName = gameName;
            this.state = new State();
        }
        static from(obj) {
            // -------------------------------- CAUTION --------------------------------
            // This implementation should be further considered.
            Object.setPrototypeOf(obj, Engine.prototype);
            if (!obj.hasOwnProperty('state'))
                obj.state = new State();
            else
                Object.setPrototypeOf(obj.state, State.prototype);
            return obj;
        }
        async loadSection(sectionName) {
            // return (await axios.post('/api/read', {
            // 	gameName: this.gameName,
            // 	sectionName
            // })).data
            return await postData.text('/api/read', {
                gameName: this.gameName,
                sectionName
            });
        }
        async selectSection(sectionName) {
            this.lst = (await this.loadSection(sectionName)).split('\n');
            this.lst1 = [];
            this.cnt = this.cnt1 = 0;
        }
        addLine(s) {
            this.lst1.push(s);
        }
        nextLine() {
            if (this.cnt1 < this.lst1.length)
                return this.lst1[this.cnt1++];
            if (this.cnt < this.lst.length)
                return this.lst[this.cnt++];
            throw 'No more lines.';
        }
        async next() {
            let flag = false;
            while (!flag) {
                const line = this.nextLine();
                if (!line.startsWith('\\')) {
                    if (line === '')
                        flag = await ops['\\newline'](this, []);
                    else {
                        this.state.applyText(line);
                        break;
                    }
                }
                else {
                    let lst = line.split(' ');
                    if (lst[0] in ops) {
                        if (lst[0] in opsType) {
                            const cnt = opsType[lst[0]];
                            lst = [...lst.slice(0, cnt), lst.slice(cnt).join(' ')];
                        }
                        flag = await ops[lst[0]](this, lst.filter(Boolean));
                    }
                    else
                        throw `Unexpected token ${lst[0]}`;
                }
            }
        }
    }

    var template = "<div :style=\"styles.frm\" @touchmove.prevent>\r\n\t<background-image :src=\"state.backgroundImage\"></background-image>\r\n\t<v-fade-transition>\r\n\t\t<div :style=\"styles.optsmodal\" v-if=\"state.opts\">\r\n\t\t\t<v-list dark dense rounded style=\"background-color: black;width: 70%\">\r\n\t\t\t\t<v-list-item v-for=\"i of state.opts.length\" @click=\"choose(i-1)\">{{state.opts[i-1]}}</v-list-item>\r\n\t\t\t</v-list>\r\n\t\t</div>\r\n\t</v-fade-transition>\r\n\t<div :style=\"styles.dialogContainer\" @click=\"next\">\r\n\t\t<v-card :style=\"styles.dialog\" elevation=\"4\">\r\n\t\t\t<div :style=\"styles.char\" v-show=\"state.char\">\r\n\t\t\t\t{{state.char}}\r\n\t\t\t\t<v-divider />\r\n\t\t\t</div>\r\n\t\t\t<span v-html=\"state.text\"></span><span class=\"type\"></span>\r\n\t\t</v-card>\r\n\t</div>\r\n\t<div style=\"position:fixed;right:0;top:0;padding:20px\">\r\n\t\t<v-btn fab small @click=\"fastForward(10)\" style=\"margin-right:10px;\">\r\n\t\t\t<v-icon>accessible_forward</v-icon>\r\n\t\t</v-btn>\r\n\t\t<v-btn fab small @click=\"fastForward(Infinity)\">\r\n\t\t\t<v-icon>directions_run</v-icon>\r\n\t\t</v-btn>\r\n\t</div>\r\n\t<v-dialog v-model=\"state.showSaves\" max-width=\"70%\" eager>\r\n\t\t<v-card style=\"min-height:90%\">\r\n\t\t\t<display-saves @select=\"onSelectSave\" @del=\"deleteSave\" />\r\n\t\t</v-card>\r\n\t</v-dialog>\r\n\t<v-prompt></v-prompt>\r\n</div>";

    var backgroundImageTemplate = "<div>\r\n\t<div :style=\"prevImageStyle\"></div>\r\n\t<transition name=\"background\">\r\n\t\t<div :style=\"curImageStyle\" v-if=\"flag\"></div>\r\n\t</transition>\r\n</div>";

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var rngBrowser = createCommonjsModule(function (module) {
    // Unique ID creation requires a high quality random # generator.  In the
    // browser this is a little complicated due to unknown quality of Math.random()
    // and inconsistent support for the `crypto` API.  We do the best we can via
    // feature-detection

    // getRandomValues needs to be invoked in a context where "this" is a Crypto
    // implementation. Also, find the complete implementation of crypto on IE11.
    var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                          (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

    if (getRandomValues) {
      // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
      var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

      module.exports = function whatwgRNG() {
        getRandomValues(rnds8);
        return rnds8;
      };
    } else {
      // Math.random()-based (RNG)
      //
      // If all else fails, use Math.random().  It's fast, but is of unspecified
      // quality.
      var rnds = new Array(16);

      module.exports = function mathRNG() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
          rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }

        return rnds;
      };
    }
    });

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */
    var byteToHex = [];
    for (var i = 0; i < 256; ++i) {
      byteToHex[i] = (i + 0x100).toString(16).substr(1);
    }

    function bytesToUuid(buf, offset) {
      var i = offset || 0;
      var bth = byteToHex;
      // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
      return ([bth[buf[i++]], bth[buf[i++]], 
    	bth[buf[i++]], bth[buf[i++]], '-',
    	bth[buf[i++]], bth[buf[i++]], '-',
    	bth[buf[i++]], bth[buf[i++]], '-',
    	bth[buf[i++]], bth[buf[i++]], '-',
    	bth[buf[i++]], bth[buf[i++]],
    	bth[buf[i++]], bth[buf[i++]],
    	bth[buf[i++]], bth[buf[i++]]]).join('');
    }

    var bytesToUuid_1 = bytesToUuid;

    function v4(options, buf, offset) {
      var i = buf && offset || 0;

      if (typeof(options) == 'string') {
        buf = options === 'binary' ? new Array(16) : null;
        options = null;
      }
      options = options || {};

      var rnds = options.random || (options.rng || rngBrowser)();

      // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
      rnds[6] = (rnds[6] & 0x0f) | 0x40;
      rnds[8] = (rnds[8] & 0x3f) | 0x80;

      // Copy bytes to buffer, if provided
      if (buf) {
        for (var ii = 0; ii < 16; ++ii) {
          buf[i + ii] = rnds[ii];
        }
      }

      return buf || bytesToUuid_1(rnds);
    }

    var v4_1 = v4;

    var template$1 = "<div style=\"padding:10px\">\r\n\t<h1>UI凑合一下得了</h1>\r\n\t<v-btn icon @click=\"add\">\r\n\t\t<v-icon>mdi-plus</v-icon>\r\n\t</v-btn>\r\n\t<!-- <div :style=\"styles.savesList\">\r\n\t\t<v-card v-for=\"i of savesListRef\" :key=\"i\" :style=\"styles.save\" elevation=\"4\" @click>\r\n\t\t\t<v-card-title>{{i}}</v-card-title>\r\n\t\t\t<v-card-actions>\r\n\t\t\t\t<v-btn icon>\r\n\t\t\t\t\t<v-icon>delete</v-icon>\r\n\t\t\t\t</v-btn>\r\n\t\t\t</v-card-actions>\r\n\t\t</v-card>\r\n\t</div> -->\r\n\t<v-list :style=\"styles.savesList\">\r\n\t\t<v-list-item v-for=\"i of savesListRef\" :key=\"i\" :style=\"styles.save\" @click=\"select(i)\">\r\n\t\t\t<v-list-item-content>\r\n\t\t\t\t{{i}}\r\n\t\t\t</v-list-item-content>\r\n\t\t\t<v-list-item-action>\r\n\t\t\t\t<v-btn icon color=\" warning\" @click.stop=\"del(i)\">\r\n\t\t\t\t\t<v-icon>delete</v-icon>\r\n\t\t\t\t</v-btn>\r\n\t\t\t</v-list-item-action>\r\n\t\t</v-list-item>\r\n\t</v-list>\r\n</div>";

    const loadSavesList = () => {
        return JSON.parse(localStorage.getItem('savesList')) || [];
    };
    var saves = VueCompositionApi.defineComponent({
        template: template$1,
        setup(props, ctx) {
            const styles = VueCompositionApi.computed(() => ({
                savesList: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    alignItems: 'center'
                },
                save: {
                    width: '90%',
                }
            }));
            const savesListRef = VueCompositionApi.ref(loadSavesList());
            const add = () => {
                const s = v4_1();
                savesListRef.value.push(s);
                localStorage.setItem('savesList', JSON.stringify(savesListRef.value));
            };
            const del = (name) => {
                const lst = savesListRef.value;
                const i = lst.indexOf(name);
                if (i !== -1) {
                    for (let j = i; j < lst.length; j++)
                        lst[j] = lst[j + 1];
                    lst.pop();
                }
                savesListRef.value = lst;
                localStorage.setItem('savesList', JSON.stringify(savesListRef.value));
                ctx.emit('del', name);
            };
            const select = (name) => {
                // console.log(name)
                ctx.emit('select', name);
            };
            return {
                styles,
                savesListRef,
                add,
                del,
                select
            };
        }
    });

    var vPromptTemplate = "<v-dialog v-model=\"state.show\" max-width=\"25em\" persistent eager>\r\n\t<v-card style=\"padding:10px\">\r\n\t\t<!-- <v-card-title style=\"padding-left:0\">{{state.label}}</v-card-title> -->\r\n\t\t<div style=\"padding:10px\">\r\n\t\t\t<v-text-field :label=\"state.label\" v-model=\"state.text\" autofocus outlined dense @keydown.stop\r\n\t\t\t\t@keydown.enter=\"confirm\">\r\n\t\t\t</v-text-field>\r\n\t\t</div>\r\n\t\t<div style=\"text-align: right;\">\r\n\t\t\t<v-btn color=\"primary\" @click=\"confirm\" text small>{{props.confirmLabel || 'Confirm'}}</v-btn>\r\n\t\t\t<v-btn @click=\"cancel\" text small>{{props.cancelLable || 'Cancel'}}</v-btn>\r\n\t\t</div>\r\n\t</v-card>\r\n</v-dialog>";

    var vConfirmTemplate = "<v-dialog v-model=\"state.show\" max-width=\"25em\" persistent eager>\r\n\t<v-card style=\"display:flex;flex-direction: column; padding:10px\" min-height=\"10em\">\r\n\t\t<div style=\"flex-grow:1;padding:10px\">\r\n\t\t\t{{state.label}}\r\n\t\t</div>\r\n\t\t<div style=\"text-align:right\">\r\n\t\t\t<v-btn color=\"primary\" text dense small ref=\"confirmRef\" @click=\"confirm\">\r\n\t\t\t\t{{props.confirmLabel || 'Confirm'}}</v-btn>\r\n\t\t\t<v-btn text dense small ref=\"cancelRef\" @click=\"cancel\">{{props.cancelLabel || 'Cancel'}}</v-btn>\r\n\t\t</div>\r\n\t</v-card>\r\n</v-dialog>";

    const promptState = VueCompositionApi.reactive({
        label: '',
        show: false,
        text: ''
    });
    let resolveText;
    const vPrompt = VueCompositionApi.defineComponent({
        template: vPromptTemplate,
        props: {
            confirmLabel: String,
            cancelLabel: String
        },
        setup(props) {
            const state = promptState;
            const confirm = () => {
                resolveText(promptState.text);
            };
            const cancel = () => {
                resolveText(undefined);
            };
            return {
                props,
                state,
                confirm,
                cancel
            };
        }
    });
    Vue.component('v-prompt', vPrompt);
    const $prompt = async (label) => {
        promptState.label = label;
        promptState.show = true;
        promptState.text = '';
        const text = await new Promise((res) => {
            resolveText = res;
        });
        promptState.show = false;
        return text;
    };
    const confirmState = VueCompositionApi.reactive({
        label: '',
        show: false,
        defaultFocus: ''
    });
    let resolveConfirm;
    const vConfirm = VueCompositionApi.defineComponent({
        template: vConfirmTemplate,
        props: {
            confirmLabel: String,
            cancelLabel: String
        },
        setup(props, ctx) {
            const state = confirmState;
            const confirmRef = VueCompositionApi.ref();
            const cancelRef = VueCompositionApi.ref();
            const confirm = () => {
                resolveConfirm(true);
            };
            const cancel = () => {
                resolveConfirm(false);
            };
            VueCompositionApi.watch(() => state.show, value => {
                if (value) {
                    ctx.root.$nextTick(() => {
                        if (state.defaultFocus === 'confirm')
                            confirmRef.value.$el.focus();
                        else if (state.defaultFocus === 'cancel')
                            cancelRef.value.$el.focus();
                    });
                }
            });
            return {
                props,
                state,
                confirmRef, cancelRef,
                confirm,
                cancel
            };
        }
    });
    Vue.component('v-confirm', vConfirm);
    const $confirm = async (label, defaultFocus = 'confirm') => {
        confirmState.label = label;
        confirmState.show = true;
        confirmState.defaultFocus = defaultFocus;
        const value = await new Promise((res) => {
            resolveConfirm = res;
        });
        confirmState.show = false;
        return value;
    };

    const backgroundImage = VueCompositionApi.defineComponent({
        template: backgroundImageTemplate,
        props: {
            src: String
        },
        setup(props, ctx) {
            const styles = VueCompositionApi.computed(() => ({
                backgroundImageDiv: {
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                }
            }));
            const prevImageStyle = VueCompositionApi.reactive(Object.assign({ backgroundImage: '' }, styles.value.backgroundImageDiv));
            const curImageStyle = VueCompositionApi.reactive(Object.assign({ backgroundImage: '' }, styles.value.backgroundImageDiv));
            const flag = VueCompositionApi.ref(true);
            let pendingImage;
            VueCompositionApi.watch(() => props.src, value => {
                if (pendingImage)
                    prevImageStyle.backgroundImage = pendingImage;
                flag.value = false;
                ctx.root.$nextTick(() => {
                    pendingImage = curImageStyle.backgroundImage = `url(${value})`;
                    flag.value = true;
                    setTimeout(() => {
                        prevImageStyle.backgroundImage = pendingImage;
                        pendingImage = undefined;
                    }, 1000);
                });
            });
            return {
                styles,
                prevImageStyle,
                curImageStyle,
                flag
            };
        }
    });
    var game = VueCompositionApi.defineComponent({
        template,
        components: {
            'background-image': backgroundImage,
            'display-saves': saves
        },
        setup(props, ctx) {
            const styles = VueCompositionApi.computed(() => ({
                frm: {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                },
                dialogContainer: {
                    width: '80%',
                    height: '35%',
                    maxHeight: '13em',
                    padding: '10px',
                },
                dialog: {
                    width: '100%',
                    height: '100%',
                    padding: '7 20',
                    opacity: 0.8,
                    backgroundColor: state.char ? '#EEE' : '#CCC',
                    transition: 'background-color 1s ease',
                    userSelect: 'none'
                },
                char: {
                    marginLeft: '-10px',
                    color: '#999',
                    width: '30%'
                },
                optsmodal: {
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    opacity: 0.7,
                    zIndex: 5,
                    padding: '10% 10%',
                    color: 'white'
                }
            }));
            const state = VueCompositionApi.reactive({
                text: '',
                char: undefined,
                backgroundImage: undefined,
                opts: undefined,
                showSaves: false
            });
            let typed;
            const finish = () => {
                state.text += engine.state.curText;
                typed.destroy();
                typed = undefined;
            };
            let ignoreAction = false;
            const choose = (i) => {
                ignoreAction = false;
                engine.ans[engine.state.qid] = [i, state.opts[i]];
                state.opts = engine.state.opts = undefined;
                next();
            };
            const updateFromEngine = async () => {
                state.backgroundImage = `/res/${gameName}${engine.state.backgroundImage}`;
                if (engine.state.qry) {
                    ignoreAction = true;
                    const ans = await $prompt(engine.state.qry);
                    engine.ans[engine.state.qid] = ans;
                    engine.state.qry = undefined;
                    ignoreAction = false;
                    next();
                    return false;
                }
                else if (engine.state.opts) {
                    ignoreAction = true;
                    state.opts = engine.state.opts;
                    return false;
                }
                else {
                    state.char = engine.state.char;
                    state.text = engine.state.text;
                    typed = new Typed('.type', {
                        strings: [engine.state.curText],
                        typeSpeed: 20,
                        onComplete: () => {
                            finish();
                        }
                    });
                }
                return true;
            };
            const next = async () => {
                if (typed) {
                    finish();
                }
                else if (!ignoreAction) {
                    ignoreAction = true;
                    await engine.next();
                    ignoreAction = false;
                    return await updateFromEngine();
                }
                return true;
            };
            const fastForward = async (numberOfSteps) => {
                numberOfSteps = numberOfSteps || Infinity;
                for (let i = 0; i < numberOfSteps; i++)
                    if (!await next())
                        break;
            };
            const loadFromSave = async (save) => {
                engine = save;
                await updateFromEngine();
            };
            const onSelectSave = async (name) => {
                if (mode === 'save')
                    localStorage.setItem(`save_${name}`, JSON.stringify(engine));
                else if (mode === 'load')
                    await loadFromSave(Engine.from(JSON.parse(localStorage.getItem(`save_${name}`))));
                state.showSaves = false;
            };
            const deleteSave = (name) => {
                localStorage.removeItem(`save_${name}`);
            };
            const handleKeydownEvent = (evt) => {
                if (evt.key === ' ')
                    next();
                if (evt.key === 's') {
                    mode = 'save';
                    state.showSaves = true;
                    ignoreAction = true;
                }
                if (evt.key === 'l') {
                    mode = 'load';
                    state.showSaves = true;
                    ignoreAction = true;
                }
            };
            // @ts-ignore
            const gameName = ctx.root.$route.params.gameName;
            let engine = new Engine(gameName);
            engine.selectSection('start').then(() => next());
            let mode;
            addEventListener('keydown', handleKeydownEvent);
            VueCompositionApi.onUnmounted(() => removeEventListener('keydown', handleKeydownEvent));
            VueCompositionApi.watch(() => state.showSaves, (value) => {
                if (!value)
                    ignoreAction = false;
            });
            // $prompt('blabla')
            return {
                styles,
                state,
                choose,
                next,
                fastForward,
                loadFromSave,
                onSelectSave,
                deleteSave
            };
        },
    });

    var template$2 = "<div :style=\"styles.frm\">\r\n\t<v-list :style=\"styles.sectionList\">\r\n\t\t<v-subheader>\r\n\t\t\t<v-list-item-content>Sections</v-list-item-content>\r\n\t\t\t<v-list-item-action>\r\n\t\t\t\t<v-btn @click=\"newSection\">Add</v-btn>\r\n\t\t\t</v-list-item-action>\r\n\t\t</v-subheader>\r\n\t\t<v-list-item v-for=\"i of sectionListRef\" :key=\"i\" @click=\"loadSection(i)\">\r\n\t\t\t<v-list-item-content>\r\n\t\t\t\t{{i}}\r\n\t\t\t</v-list-item-content>\r\n\t\t\t<v-list-item-action>\r\n\t\t\t\t<v-btn icon color=\"warning\" @click.stop=\"deleteSection(i)\">\r\n\t\t\t\t\t<v-icon>delete</v-icon>\r\n\t\t\t\t</v-btn>\r\n\t\t\t</v-list-item-action>\r\n\t\t</v-list-item>\r\n\t</v-list>\r\n\t<div style=\"flex-grow: 1;height: 100%;padding-left: 10px\">\r\n\t\t<div style=\"display:inline-block;margin-right:10px\">\r\n\t\t\t<v-text-field label=\"Game\" v-model=\"state.gameName\" @keydown.enter=\"loadSectionList(state.gameName)\">\r\n\t\t\t</v-text-field>\r\n\t\t</div>\r\n\t\t<div style=\"display:inline-block;margin-right:10px\">\r\n\t\t\t<v-text-field label=\"Section\" v-model=\"state.sectionName\"></v-text-field>\r\n\t\t</div>\r\n\t\t<v-textarea no-resize rows=\"20\" v-model=\"state.content\" @change=\"updateSection\" ref=\"editorRef\"></v-textarea>\r\n\t</div>\r\n\t<v-confirm></v-confirm>\r\n\t<v-prompt></v-prompt>\r\n</div>";

    var editor = VueCompositionApi.defineComponent({
        template: template$2,
        setup() {
            const styles = VueCompositionApi.computed(() => ({
                frm: {
                    display: 'flex',
                    padding: '10px',
                    height: '100%',
                },
                sectionList: {
                    width: '20%'
                }
            }));
            const state = VueCompositionApi.reactive({
                gameName: undefined,
                sectionName: undefined,
                content: undefined
            });
            const editorRef = VueCompositionApi.ref();
            const sectionListRef = VueCompositionApi.ref([]);
            const loadSectionList = async (gameName) => {
                sectionListRef.value = await postData.json('/api/lst', {
                    gameName
                });
            };
            const newSection = async () => {
                const sectionName = (await $prompt('Section name:')) || v4_1();
                await postData('/api/write', {
                    gameName: state.gameName,
                    sectionName,
                    content: ''
                });
                await loadSectionList(state.gameName);
                await loadSection(sectionName);
            };
            const deleteSection = async (sectionName) => {
                if (!await $confirm(`Are you sure you want to delete "${sectionName}"?`))
                    return;
                await postData('/api/del', {
                    gameName: state.gameName,
                    sectionName
                });
                await loadSectionList(state.gameName);
                state.sectionName = undefined;
            };
            const loadSection = async (name) => {
                state.sectionName = name;
                state.content = await postData.text('/api/read', {
                    gameName: state.gameName,
                    sectionName: name
                });
                editorRef.value.focus();
            };
            const updateSection = async () => {
                await postData('/api/write', {
                    gameName: state.gameName,
                    sectionName: state.sectionName,
                    content: state.content
                });
            };
            return {
                styles,
                state,
                sectionListRef,
                editorRef,
                loadSectionList,
                newSection,
                deleteSection,
                loadSection,
                updateSection
            };
        }
    });

    var template$3 = "<div style=\"padding:10px\">\r\n\t<h1>UI就随便吧，反正也没有人会用</h1>\r\n\t<div style=\"display:flex;flex-direction:column;align-items:center;margin-top:20px\">\r\n\t\t<v-btn :style=\"styles.bar\" @click=\"start\">start</v-btn>\r\n\t\t<router-link :style=\"styles.bar\" to=\"/editor\" tag=\"v-btn\">Editor</router-link>\r\n\t</div>\r\n\t<v-prompt></v-prompt>\r\n</div>";

    // import Vue from 'vue'
    // import VueRouter from 'vue-router'
    Vue.use(VueCompositionApi__default);
    const Index = VueCompositionApi.defineComponent({
        template: template$3,
        setup(props, ctx) {
            const styles = VueCompositionApi.computed(() => ({
                bar: {
                    width: '40%',
                    marginBottom: '10px'
                }
            }));
            const start = async () => {
                const gameName = await $prompt('Game name:');
                if (!gameName)
                    return;
                // @ts-ignore
                ctx.root.$router.push(`/game/${gameName}`);
            };
            return {
                styles,
                start
            };
        }
    });
    const router = new VueRouter({
        routes: [
            {
                path: '/', component: Index
            },
            { path: '/game/:gameName', component: game },
            { path: '/editor', component: editor },
            { path: '/saves', component: saves }
        ]
    });
    // @ts-ignore
    new Vue(VueCompositionApi.defineComponent({
        el: '#app',
        router,
        vuetify: new Vuetify()
    }));

})));
//# sourceMappingURL=bundle.js.map
