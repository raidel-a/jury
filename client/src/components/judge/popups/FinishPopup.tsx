import Button from '../../Button';
import Popup from '../../Popup';
import TextArea from '../../TextArea';
import CriteriaRatingForm from '../CriteriaRating';

interface FinishPopupProps {
    /* Function to modify the popup state variable */
    setEnabled: React.Dispatch<React.SetStateAction<boolean>>;

    /* Judge to vote on */
    judge: Judge;

    /* State variable for determining if popup is open */
    enabled: boolean;

    /* Callback function for flagging a project */
    callback: () => Promise<void>;

    // TODO: Export all this to a global store for the judge
    /* Starred status of project */
    starred: boolean;

    /* Setter function for starred status */
    setStarred: React.Dispatch<React.SetStateAction<boolean>>;

    /* Notes for project */
    notes: string;

    /* Setter function for notes */
    setNotes: React.Dispatch<React.SetStateAction<string>>;

    /* Criteria rating */
    criteriaRating: CriteriaRating;

    /* Setter for criteria rating */
    setCriteriaRating: React.Dispatch<React.SetStateAction<CriteriaRating>>;

    /* Criteria validation state */
    criteriaValid: boolean;

    /* Setter for criteria validation */
    setCriteriaValid: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Component to show when the user clicks the "Submit" button
 */
const FinishPopup = (props: FinishPopupProps) => {
    if (!props.enabled) return null;

    const done = async () => {
        if (!props.criteriaValid) {
            alert('Please rate all 5 criteria before submitting.');
            return;
        }
        await props.callback();
    };

    return (
        <Popup enabled={props.enabled} setEnabled={props.setEnabled} className="text-center max-h-[90vh]">
            <div className="overflow-y-auto max-h-[80vh] pr-2">
                <h1 className="text-3xl font-bold text-primary">Judge Project</h1>

                <div className="text-left">
                    <CriteriaRatingForm
                        rating={props.criteriaRating}
                        onRatingChange={props.setCriteriaRating}
                        onValidChange={props.setCriteriaValid}
                        disabled={false}
                    />

                    <div className="mt-6 p-4 border rounded-lg bg-gray-400">
                        <div className="flex items-center mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={props.starred}
                                    onChange={(e) => props.setStarred(e.target.checked)}
                                    className="mr-2 scale-125"
                                />
                                <span className="text-lg font-medium">⭐ Mark as standout project</span>
                            </label>
                        </div>

                        <h3 className="text-lighter text-sm text-left mb-1">Personal Notes</h3>
                        <TextArea
                            label="Type any personal comments here"
                            value={props.notes}
                            setValue={props.setNotes}
                            className='mt-1'
                        />
                    </div>
                </div>
            </div>

            <Button type="primary" onClick={done} className="mt-4" disabled={!props.criteriaValid}>
                Submit
            </Button>
        </Popup>
    );
};

export default FinishPopup;
