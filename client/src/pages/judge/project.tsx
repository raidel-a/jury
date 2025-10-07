import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Container from '../../components/Container';
import JuryHeader from '../../components/JuryHeader';
import Paragraph from '../../components/Paragraph';
import Back from '../../components/Back';
import { getRequest, putRequest } from '../../api';
import { errorAlert } from '../../util';
import Star from '../../components/judge/Star';
import TextArea from '../../components/TextArea';
import CriteriaRatingForm from '../../components/judge/CriteriaRating';

const Project = () => {
    const { id } = useParams();
    const [project, setProject] = useState<null | JudgedProjectWithUrl>(null);
    const [notes, setNotes] = useState('');
    const [starred, setStarred] = useState(false);
    const [criteriaRating, setCriteriaRating] = useState<CriteriaRating>({
        completion: 0,
        originality: 0,
        learning: 0,
        design: 0,
        technical: 0
    });
    const [criteriaValid, setCriteriaValid] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const projRes = await getRequest<JudgedProjectWithUrl>(`/judge/project/${id}`, 'judge');
            if (projRes.status !== 200) {
                errorAlert(projRes);
                return;
            }
            const proj = projRes.data as JudgedProjectWithUrl;
            setProject(proj);
            setNotes(proj.comments || '');
            setStarred(proj.starred);
            if (proj.criteria_rating) {
                setCriteriaRating(proj.criteria_rating);
            }
        }

        fetchData();
    }, []);

    const updateNotes = async () => {
        const url = `/judge/notes/${project?.project_id}`;
        const res = await putRequest<OkResponse>(url, 'judge', {
            notes,
        });
        if (res.status !== 200) {
            errorAlert(res);
        }
    };

    // Update notes with a delay for typing
    useEffect(() => {
        if (!project) return;

        const delayDebounceFn = setTimeout(updateNotes, 1000);

        return () => {
            clearTimeout(delayDebounceFn);
        };
    }, [notes]);

    const updateStar = async () => {
        const res = await putRequest<OkResponse>('/judge/star', 'judge', {
            project: project?.project_id,
            starred: !starred,
        });
        if (res.status !== 200) {
            errorAlert(res);
        }
    };

    const updateCriteria = async () => {
        if (!criteriaValid) return;

        const url = `/judge/criteria/${project?.project_id}`;
        const res = await putRequest<OkResponse>(url, 'judge', {
            criteria_rating: criteriaRating,
        });
        if (res.status !== 200) {
            errorAlert(res);
        }
    };

    // Update criteria with a delay for typing
    useEffect(() => {
        if (!project || !criteriaValid) return;

        const delayDebounceFn = setTimeout(updateCriteria, 1000);

        return () => {
            clearTimeout(delayDebounceFn);
        };
    }, [criteriaRating]);

    if (!project) return <div>Loading...</div>;

    return (
        <>
            <JuryHeader withLogout />
            <Container noCenter={true} className="px-2">
                <Back location="/judge" />
                <h1 className="text-3xl mb-1 font-bold">
                    <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary duration-200"
                    >
                        {project.name}
                    </a>
                </h1>
                <h2 className="text-xl font-bold text-light mb-2">Table {project.location}</h2>
                <div className="flex flex-row justify-center text-left mb-2 px-2">
                    <Star
                        active={starred}
                        setActive={setStarred}
                        className="mr-4"
                        onClick={updateStar}
                    />
                    <p className="text-light">
                        Star projects you think should win the top places in the hackathon.
                    </p>
                </div>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-dark mb-2">Criteria Ratings</h2>
                    <CriteriaRatingForm
                        rating={criteriaRating}
                        onRatingChange={setCriteriaRating}
                        onValidChange={setCriteriaValid}
                        disabled={false}
                    />
                </div>
                <TextArea
                    label="Personal Notes"
                    value={notes}
                    setValue={setNotes}
                    className="mb-4"
                />
                <h2 className="text-2xl font-bold text-dark mb-2">Project Description</h2>
                <Paragraph text={project.description} className="text-black" />
            </Container>
        </>
    );
};

export default Project;
