// app/components/modals/TourGuide.tsx
import React from "react";
import { useEffect, useState } from "react";
import type { CallBackProps, Step } from "react-joyride";
import Joyride, { EVENTS, STATUS } from "react-joyride";
import { State as OriginalJoyState, TourGuideProps } from "@/types";
import tourGuideData from "@/public/data/guid.json";

interface State extends OriginalJoyState {
    steps: Step[];
}
type CustomStep = {
    title: string;
    placement: any;
    description: string;
    target: string;
};
const TourGuide = ({ start, setStartTour, onTourEnd }: TourGuideProps) => {
    const [progress, setProgress] = useState<number>(1);

    const generateSteps = (val: number): Step[] => tourGuideData?.map((step: any, index: number) => ({
        title: step.title,
        content: (
            <div key={index} >
                <p className="text-sm">{step.description}</p>
                <div className="absolute bottom-[30px] left-1/4 right-1/4 z-0 text-center text-xs text-neutral-400">
                    {val} of {tourGuideData.length}
                </div>
            </div>
        ),
        target: step.target
    }));


    const [{ run, steps }, setState] = useState<State>({
        run: start,
        stepIndex: 0,
        steps: generateSteps(progress),
    });

    useEffect(() => {
        setState((prevState) => ({
            ...prevState,
            steps: generateSteps(progress),
        }));
    }, [progress]);

    useEffect(() => {
        if (start) {
            setState((prevState) => ({
                ...prevState,
                run: true,
                stepIndex: 0,
            }));
        }
    }, [start]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index } = data;

        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setState({ steps, run: false, stepIndex: 0 });
            setStartTour(false);
            onTourEnd();
        } else if (([EVENTS.STEP_BEFORE] as string[]).includes(type)) {
            setProgress(index + 1);
        }
    };

    return (
        <Joyride
            continuous
            callback={handleJoyrideCallback}
            run={run}
            steps={steps}
            scrollToFirstStep
            hideCloseButton
            disableCloseOnEsc
            disableOverlayClose
            spotlightPadding={10}
            // showProgress
            showSkipButton
            debug
            styles={{
                overlay: {
                    border: "2px solid #3b82f6bf",
                    maxHeight: "100%"
                },
                spotlight: {
                    border: "1px solid #3b82f6bf",
                    maxWidth: "100%"
                },
                buttonNext: {
                    outline: "2px solid transparent",
                    outlineOffset: "2px",
                    backgroundColor: "#3b82f6bf",
                    borderRadius: "5px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                },
                buttonSkip: {
                    outline: "1px solid #3b82f6bf",
                    borderRadius: "8px",
                    color: "#A3A3A3",
                    fontSize: "10px",
                },
                tooltipFooter: {
                    margin: "0px 16px 10px 10px",
                },
                tooltipTitle: {
                    width: "100%",
                    textAlign: "center",
                    backgroundImage: "linear-gradient(to bottom, rgba(59, 130, 246, 0.75) 55%, rgba(255, 255, 255, 0.75))",
                    fontSize: "1.125rem",
                    fontFamily: "monospace",
                },
                buttonBack: {
                    outline: "2px solid transparent",
                },
                options: {
                    zIndex: 100,
                    arrowColor: "#1F1F1F",
                    backgroundColor: "#1F1F1F",
                    textColor: "#FFFFFF",
                    overlayColor: "rgba(0, 0, 0, 0.9)",
                    primaryColor: "#3b82f6bf",
                },
            }}
            locale={{
                back: (
                    <p className="font-bold focus:ring-transparent focus-visible:outline-none">
                        {`<-`}
                    </p>
                ),
            }}
        />
    );
};

export default TourGuide;