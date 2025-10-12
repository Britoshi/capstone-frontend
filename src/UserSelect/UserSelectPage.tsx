import {useEffect, useState} from "react";

interface LoadingProps {
    onLogin?: (type: SelectionType) => void;
}

const fadeMs = 700;

type SelectionType = "none" | "guest" | "explore" | "login";

export default function UserSelectPage({onLogin}: LoadingProps) {
    return (
        <div
            className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0d10] text-neutral-200"
            style={{
                // IMPORTANT: transition must include opacity to catch 'transitionend'
                transition: `opacity ${fadeMs}ms ease`,
            }}
        >
            <div className="grid-cols-2 grid gap-10">
                <div className="32 h-32 border-8 border-amber-100 rounded-4xl flex items-center justify-center bg-amber-100"
                onClick={() => alert("HI")}>

                </div>
                <div className="w-32 h-32 border-8 border-amber-100 rounded-4xl flex items-center justify-center bg-amber-100">

                </div>
            </div>
        </div>
    );
}
