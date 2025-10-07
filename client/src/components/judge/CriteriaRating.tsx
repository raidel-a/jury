import React, { useMemo, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

interface CriteriaRating {
    completion: number;
    originality: number;
    learning: number;
    design: number;
    technical: number;
}

interface CriteriaRatingProps {
    rating: CriteriaRating;
    onRatingChange: (rating: CriteriaRating) => void;
    onValidChange: (isValid: boolean) => void;
    disabled?: boolean;
    className?: string;
}

interface CriterionDefinition {
    title: string;
    description: string;
    scale: string[];
}

const criteriaDefinitions: Record<keyof CriteriaRating, CriterionDefinition> = {
    completion: {
        title: "Completion",
        description: "Does the hack work? Did the team achieve everything they wanted?",
        scale: ["Broken/No demo", "Basic functionality", "Core features work", "Mostly complete", "Fully functional"]
    },
    originality: {
        title: "Originality",
        description: "Has this been done before at other hackathons? How creative is their project?",
        scale: ["Very common idea", "Somewhat common", "Moderately unique", "Quite original", "Highly innovative"]
    },
    learning: {
        title: "Learning",
        description: "Did the team stretch themselves? Did they try to learn something new?",
        scale: ["No new skills", "Minimal learning", "Some new concepts", "Significant learning", "Major skill development"]
    },
    design: {
        title: "Design",
        description: "Did the team put thought into the UX? How well-designed was the UI?",
        scale: ["Poor/No design", "Basic design", "Decent UX/UI", "Good design", "Excellent design"]
    },
    technical: {
        title: "Technical",
        description: "How technically impressive was the hack? Was the problem tackled difficult?",
        scale: ["Simple implementation", "Basic technical work", "Moderate complexity", "Technically challenging", "Highly sophisticated"]
    }
};

const CriteriaRatingForm: React.FC<CriteriaRatingProps> = ({
    rating,
    onRatingChange,
    onValidChange,
    disabled = false,
    className
}) => {
    // Validation: All criteria must be 1-5
    const isComplete = useMemo(() => {
        return rating.completion >= 1 && rating.completion <= 5 &&
               rating.originality >= 1 && rating.originality <= 5 &&
               rating.learning >= 1 && rating.learning <= 5 &&
               rating.design >= 1 && rating.design <= 5 &&
               rating.technical >= 1 && rating.technical <= 5;
    }, [rating]);

    // Notify parent of validation state changes
    useEffect(() => {
        onValidChange(isComplete);
    }, [isComplete, onValidChange]);

    const updateRating = (criterion: keyof CriteriaRating, value: number) => {
        if (disabled) return;
        onRatingChange({
            ...rating,
            [criterion]: value
        });
    };

    const renderStarRating = (criterion: keyof CriteriaRating, currentValue: number) => {
        const definition = criteriaDefinitions[criterion];
        const isRated = currentValue >= 1 && currentValue <= 5;

        return (
            <div className={twMerge(
                "border-2 rounded-lg p-4 mb-4 transition-colors",
                isRated ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50",
                disabled && "opacity-60"
            )}>
                <h3 className="text-lg font-semibold text-dark mb-1">{definition.title}</h3>
                <p className="text-sm text-light mb-3">{definition.description}</p>

                <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            onClick={() => updateRating(criterion, value)}
                            disabled={disabled}
                            className={twMerge(
                                "w-10 h-10 rounded-full border-2 text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                                currentValue >= value
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white border-gray-300 text-gray-600 hover:border-primary hover:text-primary",
                                disabled && "cursor-not-allowed hover:border-gray-300 hover:text-gray-600"
                            )}
                            title={definition.scale[value - 1]}
                        >
                            {value}
                        </button>
                    ))}
                </div>

                <div className="text-xs text-light">
                    {currentValue >= 1 && currentValue <= 5 ? (
                        <span className="text-primary font-medium">
                            {currentValue} - {definition.scale[currentValue - 1]}
                        </span>
                    ) : (
                        <span className="text-error">Please select a rating (1-5)</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={twMerge("space-y-2", className)}>
            <div className="mb-0">
                <h2 className="text-xl font-bold text-dark my-2">Project Evaluation Criteria</h2>
                <p className="text-sm text-light mb-0">
                    Please rate this project on all 5 criteria using a scale of 1-5. All criteria must be rated to continue.
                </p>
                <div className={twMerge(
                    "text-sm font-medium rounded",
                    isComplete ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                )}>
                    {isComplete ? "✓ All criteria rated" : "⚠ Please rate all 5 criteria"}
                </div>
            </div>

            {Object.keys(criteriaDefinitions).map((criterion) => (
                <div key={criterion}>
                    {renderStarRating(criterion as keyof CriteriaRating, rating[criterion as keyof CriteriaRating])}
                </div>
            ))}
        </div>
    );
};

export default CriteriaRatingForm;
