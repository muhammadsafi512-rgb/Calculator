import {useReducer, useState} from 'react';
import './calculator.css';

interface Key {
  label: string;
  type: Action["type"];
  value?: string;
  className?: string;
}
const keys: Key[] = [
  { label: "Clear", type: "clear", className: "accent wide"},
  { label:"C", type: "back", className: "accent"},
  { label: "÷", type: "operator", value: "÷" },

  { label: "7", type: "number", value: "7" },
  { label: "8", type: "number", value: "8" },
  { label: "9", type: "number", value: "9" },
  { label: "×", type: "operator", value: "×" },

  { label: "4", type: "number", value: "4" },
  { label: "5", type: "number", value: "5" },
  { label: "6", type: "number", value: "6" },
  { label: "-", type: "operator", value: "-" },

    { label: "1", type: "number", value: "1" },
    { label: "2", type: "number", value: "2" },
    { label: "3", type: "number", value: "3" },
    { label: "+", type: "operator", value: "+" },

    { label: "0", type: "number", value: "0" },
    { label: ".", type: "number", value: "." },
    { label: "=", type: "equals", className: "accent wide" },
];

type Operator = "+" | "-" | "×" | "÷";

interface CalculatorState {
  current: string;
  tokens: string[];
  expression: string;
  justEvaluated: boolean;
  waitingForOperator: boolean;
}

type Action =
  | { type: "number"; value: string }
  | { type: "operator"; value: Operator }
  | { type: "equals" }
  | { type: "back" }
  | { type: "clear" };

    const initialState = {
        current: "0",
        tokens: [],
        expression: "",
        justEvaluated: false,
        waitingForOperator: false,
    };

    function calculateExpression(tokens: string[]): string {

        const values = tokens.filter((_, index) => index % 2 === 0).map(Number);
        const operators = tokens.filter((_, index) => index % 2 === 1);

        let i = 0;
        while(i < operators.length ) {
            if (operators[i] === "×" || operators[i] === "÷") {
                const result = operators[i] === "×" ? values[i] * values[i + 1] : values[i] / values[i + 1];
            
                if (!Number.isFinite(result)) {
                throw new Error("Invalid expression: Division by zero");
                }
                values.splice(i, 2, result);
                operators.splice(i, 1);
    }else{
        i+=1;
    }
}

let result = values[0];

operators.forEach((operator, index) => {
    result = operator === "+" ? result + values[index + 1] : result - values[index + 1];
});

return String(Number(result.toPrecision(10)));
}
    function reducer(state: CalculatorState, action: Action): CalculatorState {
        switch (action.type) {
            case "number":{
                const v = action.value;
                const startsNew = state.justEvaluated || state.current === "Error";
                const startNumber = startsNew || state.waitingForOperator;
                const reset = startsNew ? {tokens: [], expression: ""} : {};

                if (v === "." ){
                    if(!startNumber && state.current.includes(".")) return state;
                    return {
                        ...state,
                        ...reset,
                        current: startNumber ? "0." : state.current + ".",
                        waitingForOperator: false,
                        justEvaluated: false,
                    };
                }
                return {
                    ...state,
                    ...reset,
                    current: startNumber || state.current === "0" ? v : state.current + v,
                    waitingForOperator: false,
                    justEvaluated: false,
                    };
            }
            case "operator":{
                if (state.current === "Error") return state;

                const negativeSign =  action.value === "-" && state.current === "0";
                if (state.waitingForOperator) {
                    if (negativeSign) {
                        return { ...state, current: "-", waitingForOperator: false };
                    }
                    return {
                        ...state, tokens: [...state.tokens.slice(0, -1), action.value],
                    };     
                    }
                    if (state.tokens.length === 0 && negativeSign) {
                        return { ...state, current: "-"};
                }
                const base = state.justEvaluated ? [] : state.tokens;
                    return {
                        ...state,
                        current: "0",
                        tokens: [...base, state.current, action.value],
                        expression: "",
                        waitingForOperator: true,
                        justEvaluated: false,
                    };
                }
            case "equals":{
                if(state.tokens.length === 0 || state.waitingForOperator || state.current === "Error") return state;
                const fullExpression = [...state.tokens, state.current];
                try{
                    return {
                        ...state,
                        current: calculateExpression(fullExpression),
                        tokens: [],
                        expression: `${fullExpression.join(" ")} =`,
                        justEvaluated: true,
                        waitingForOperator: false,
                    };
                } catch (error) {
                    return {
                        ...initialState, current: "Error",
                    };
                }
            }
            case "back": {
                if (state.justEvaluated || state.waitingForOperator || state.current === "Error") return state;
                const next = state.current.slice(0, -1);
                return { ...state, current: next === "" ? "0" : next };
            }
            case "clear":{
                return initialState;
            }          
                default:
                return state;
        }
    }
    export default function calculator() {
        const[theme, setTheme] = useState<"light" | "dark">("light") ;
        const [state, dispatch] = useReducer(reducer, initialState);

        function handleKeyPress(key: Key) {
            dispatch({ type: key.type, value: key.value } as Action);
        }

        return (
        <div className= "page min-h-screen flex items-center justify-center bg-white" data-theme={theme}>
            <div className="w-[280px] bg-[var(--frame)] p-2.5 rounded-lg">
                <div className= "bg-[var(--accent)] rounded-2xl flex justify-center gap-2">
                    <label>
                        light{" "}
                        <input
                            type="radio" name="theme" checked={theme === "light"} onChange={() => setTheme("light")}
                        />
                    </label>
                    <label>
                        dark{" "}
                        <input
                            type="radio" name="theme"  checked={theme === "dark"} onChange={() => setTheme("dark")}
                        />
                    </label>
                    <span>©Muhammad Safi</span>
                </div>
                <div className="bg-[var(--screen)] text-[var(--ink)] h-[88px] flex flex-col justify-end p-2.5">
                    <div className="text-xl text-[var(--ink)] text-right">{state.expression || state.tokens.join(" ")}</div>
                    <div className="text-3xl text-[var(--ink)] text-right">{state.current}</div>
                </div>
                <div className="bg-[var(--screen)] grid grid-cols-4 gap-2.5 p-1.5">
                    {keys.map((key, index) => (
                        <button key={index} className={"h-[50px] border-0 rounded text-[18px] cursor-pointer" +(key.className?.includes("accent") ? " bg-[var(--accent)] text-black" : " bg-[var(--key)] text-white" ) + (key.className?.includes("wide")  ?  " col-span-2" : "" ) } onClick={() => handleKeyPress(key)}>
                            {key.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}