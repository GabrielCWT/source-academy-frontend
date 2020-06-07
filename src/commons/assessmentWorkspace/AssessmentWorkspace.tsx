import {
  Button,
  ButtonGroup,
  Card,
  Classes,
  Dialog,
  Intent,
  NonIdealState,
  Spinner
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import * as React from 'react';

import { stringify } from 'js-slang/dist/utils/stringify';

import { Variant } from 'js-slang/dist/types';
import { InterpreterOutput } from '../application/ApplicationTypes';
import {
  Assessment,
  AssessmentCategories,
  AutogradingResult,
  IMCQQuestion,
  IProgrammingQuestion,
  Library,
  Question,
  QuestionTypes,
  Testcase
} from '../assessment/AssessmentTypes';
import { ControlBarProps } from '../controlBar/ControlBar';
import { ControlBarChapterSelect } from '../controlBar/ControlBarChapterSelect';
import { ControlBarClearButton } from '../controlBar/ControlBarClearButton';
import { ControlBarEvalButton } from '../controlBar/ControlBarEvalButton';
import { ControlBarNextButton } from '../controlBar/ControlBarNextButton';
import { ControlBarPreviousButton } from '../controlBar/ControlBarPreviousButton';
import { ControlBarQuestionViewButton } from '../controlBar/ControlBarQuestionViewButton';
import { ControlBarResetButton } from '../controlBar/ControlBarResetButton';
import { ControlBarRunButton } from '../controlBar/ControlBarRunButton';
import { ControlButtonSaveButton } from '../controlBar/ControlBarSaveButton';
import controlButton from '../ControlButton';
import { Position } from '../editor/EditorTypes';
import Markdown from '../Markdown';
import { SideContentProps } from '../sideContent/SideContent';
import SideContentAutograder from '../sideContent/SideContentAutograder';
import SideContentToneMatrix from '../sideContent/SideContentToneMatrix';
import { SideContentTab, SideContentType } from '../sideContent/SideContentTypes';
import Constants from '../utils/Constants';
import { beforeNow } from '../utils/DateHelper';
import { history } from '../utils/HistoryHelper';
import { showWarningMessage } from '../utils/NotificationsHelper';
import { assessmentCategoryLink } from '../utils/ParamParseHelper';
import Workspace, { WorkspaceProps } from '../workspace/Workspace';
import { WorkspaceState } from '../workspace/WorkspaceTypes';
import AssessmentWorkspaceGradingResult from './AssessmentWorkspaceGradingResult';

export type AssessmentWorkspaceProps = DispatchProps & StateProps & OwnProps;

export type DispatchProps = {
  handleActiveTabChange: (activeTab: SideContentType) => void;
  handleAssessmentFetch: (assessmentId: number) => void;
  handleBrowseHistoryDown: () => void;
  handleBrowseHistoryUp: () => void;
  handleChapterSelect: (chapter: any, changeEvent: any) => void;
  handleClearContext: (library: Library) => void;
  handleDeclarationNavigate: (cursorPosition: Position) => void;
  handleEditorEval: () => void;
  handleEditorValueChange: (val: string) => void;
  handleEditorHeightChange: (height: number) => void;
  handleEditorWidthChange: (widthChange: number) => void;
  handleEditorUpdateBreakpoints: (breakpoints: string[]) => void;
  handleInterruptEval: () => void;
  handleReplEval: () => void;
  handleReplOutputClear: () => void;
  handleReplValueChange: (newValue: string) => void;
  handleResetWorkspace: (options: Partial<WorkspaceState>) => void;
  handleSave: (id: number, answer: number | string) => void;
  handleSideContentHeightChange: (heightChange: number) => void;
  handleTestcaseEval: (testcaseId: number) => void;
  handleUpdateCurrentAssessmentId: (assessmentId: number, questionId: number) => void;
  handleUpdateHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  handleDebuggerPause: () => void;
  handleDebuggerResume: () => void;
  handleDebuggerReset: () => void;
  handlePromptAutocomplete: (row: number, col: number, callback: any) => void;
};

export type OwnProps = {
  assessmentId: number;
  questionId: number;
  notAttempted: boolean;
  closeDate: string;
};

export type StateProps = {
  assessment?: Assessment;
  autogradingResults: AutogradingResult[];
  editorPrepend: string;
  editorValue: string | null;
  editorPostpend: string;
  editorTestcases: Testcase[];
  editorHeight?: number;
  editorWidth: string;
  breakpoints: string[];
  highlightedLines: number[][];
  hasUnsavedChanges: boolean;
  isRunning: boolean;
  isDebugging: boolean;
  enableDebugging: boolean;
  newCursorPosition?: Position;
  output: InterpreterOutput[];
  replValue: string;
  sideContentHeight?: number;
  storedAssessmentId?: number;
  storedQuestionId?: number;
};

class AssessmentWorkspace extends React.Component<
  AssessmentWorkspaceProps,
  { showOverlay: boolean; showResetTemplateOverlay: boolean }
> {
  public constructor(props: AssessmentWorkspaceProps) {
    super(props);
    this.state = {
      showOverlay: false,
      showResetTemplateOverlay: false
    };
    this.props.handleEditorValueChange('');
  }

  /**
   * After mounting (either an older copy of the assessment
   * or a loading screen), try to fetch a newer assessment,
   * and show the briefing.
   */
  public componentDidMount() {
    this.props.handleAssessmentFetch(this.props.assessmentId);
    if (this.props.questionId === 0 && this.props.notAttempted) {
      this.setState({ showOverlay: true });
    }
    if (!this.props.assessment) {
      return;
    }

    let questionId = this.props.questionId;
    if (this.props.questionId >= this.props.assessment.questions.length) {
      questionId = this.props.assessment.questions.length - 1;
    }

    const question: Question = this.props.assessment.questions[questionId];

    let answer = '';
    if (question.type === QuestionTypes.programming) {
      if (question.answer) {
        answer = (question as IProgrammingQuestion).answer as string;
      } else {
        answer = (question as IProgrammingQuestion).solutionTemplate;
      }
    }

    this.props.handleEditorValueChange(answer);
  }

  /**
   * Once there is an update (due to the assessment being fetched), check
   * if a workspace reset is needed.
   */
  public componentDidUpdate() {
    this.checkWorkspaceReset(this.props);
  }

  public render() {
    if (this.props.assessment === undefined || this.props.assessment.questions.length === 0) {
      return (
        <NonIdealState
          className={classNames('WorkspaceParent', Classes.DARK)}
          description="Getting mission ready..."
          icon={<Spinner size={Spinner.SIZE_LARGE} />}
        />
      );
    }

    const overlay = (
      <Dialog className="assessment-briefing" isOpen={this.state.showOverlay}>
        <Card>
          <Markdown content={this.props.assessment.longSummary} />
          <Button
            className="assessment-briefing-button"
            // tslint:disable-next-line jsx-no-lambda
            onClick={() => this.setState({ showOverlay: false })}
            text="Continue"
          />
        </Card>
      </Dialog>
    );

    const closeOverlay = () => this.setState({ showResetTemplateOverlay: false });
    const resetTemplateOverlay = (
      <Dialog
        className="assessment-reset"
        icon={IconNames.ERROR}
        isCloseButtonShown={true}
        isOpen={this.state.showResetTemplateOverlay}
        onClose={closeOverlay}
        title="Confirmation: Reset editor?"
      >
        <div className={Classes.DIALOG_BODY}>
          <Markdown content="Are you sure you want to reset the template?" />
          <Markdown content="*Note this will not affect the saved copy of your program, unless you save over it.*" />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <ButtonGroup>
            {controlButton('Cancel', null, closeOverlay, {
              minimal: false
            })}
            {controlButton(
              'Confirm',
              null,
              () => {
                closeOverlay();
                this.props.handleEditorValueChange(
                  (this.props.assessment!.questions[questionId] as IProgrammingQuestion)
                    .solutionTemplate
                );
                this.props.handleUpdateHasUnsavedChanges(true);
              },
              { minimal: false, intent: Intent.DANGER }
            )}
          </ButtonGroup>
        </div>
      </Dialog>
    );

    /* If questionId is out of bounds, set it to the max. */
    const questionId =
      this.props.questionId >= this.props.assessment.questions.length
        ? this.props.assessment.questions.length - 1
        : this.props.questionId;
    const question: Question = this.props.assessment.questions[questionId];
    const workspaceProps: WorkspaceProps = {
      controlBarProps: this.controlBarProps(questionId),
      editorProps:
        question.type === QuestionTypes.programming
          ? {
              editorSessionId: '',
              editorValue: this.props.editorValue!,
              handleDeclarationNavigate: this.props.handleDeclarationNavigate,
              handleEditorEval: this.props.handleEditorEval,
              handleEditorValueChange: this.props.handleEditorValueChange,
              handleUpdateHasUnsavedChanges: this.props.handleUpdateHasUnsavedChanges,
              breakpoints: this.props.breakpoints,
              highlightedLines: this.props.highlightedLines,
              newCursorPosition: this.props.newCursorPosition,
              handleEditorUpdateBreakpoints: this.props.handleEditorUpdateBreakpoints,
              handlePromptAutocomplete: this.props.handlePromptAutocomplete,
              isEditorAutorun: false
            }
          : undefined,
      editorHeight: this.props.editorHeight,
      editorWidth: this.props.editorWidth,
      handleEditorHeightChange: this.props.handleEditorHeightChange,
      handleEditorWidthChange: this.props.handleEditorWidthChange,
      handleSideContentHeightChange: this.props.handleSideContentHeightChange,
      hasUnsavedChanges: this.props.hasUnsavedChanges,
      mcqProps: {
        mcq: question as IMCQQuestion,
        handleMCQSubmit: (option: number) =>
          this.props.handleSave(this.props.assessment!.questions[questionId].id, option)
      },
      sideContentHeight: this.props.sideContentHeight,
      sideContentProps: this.sideContentProps(this.props, questionId),
      replProps: {
        handleBrowseHistoryDown: this.props.handleBrowseHistoryDown,
        handleBrowseHistoryUp: this.props.handleBrowseHistoryUp,
        handleReplEval: this.props.handleReplEval,
        handleReplValueChange: this.props.handleReplValueChange,
        output: this.props.output,
        replValue: this.props.replValue
      }
    };
    return (
      <div className={classNames('WorkspaceParent', Classes.DARK)}>
        {overlay}
        {resetTemplateOverlay}
        <Workspace {...workspaceProps} />
      </div>
    );
  }

  /**
   * Checks if there is a need to reset the workspace, then executes
   * a dispatch (in the props) if needed.
   */
  private checkWorkspaceReset(props: AssessmentWorkspaceProps) {
    /* Don't reset workspace if assessment not fetched yet. */
    if (this.props.assessment === undefined) {
      return;
    }

    /* Reset assessment if it has changed.*/
    const assessmentId = this.props.assessmentId;
    const questionId = this.props.questionId;

    if (
      this.props.storedAssessmentId === assessmentId &&
      this.props.storedQuestionId === questionId
    ) {
      return;
    }

    const question = this.props.assessment.questions[questionId];

    let autogradingResults: AutogradingResult[] = [];
    let editorValue: string = '';
    let editorPrepend: string = '';
    let editorPostpend: string = '';
    let editorTestcases: Testcase[] = [];

    if (question.type === QuestionTypes.programming) {
      const questionData = question as IProgrammingQuestion;
      autogradingResults = questionData.autogradingResults;
      editorPrepend = questionData.prepend;
      editorPostpend = questionData.postpend;
      editorTestcases = questionData.testcases;

      editorValue = questionData.answer as string;
      if (!editorValue) {
        editorValue = questionData.solutionTemplate!;
      }
    }

    this.props.handleEditorUpdateBreakpoints([]);
    this.props.handleUpdateCurrentAssessmentId(assessmentId, questionId);
    this.props.handleResetWorkspace({
      autogradingResults,
      editorPrepend,
      editorValue,
      editorPostpend,
      editorTestcases
    });
    this.props.handleClearContext(question.library);
    this.props.handleUpdateHasUnsavedChanges(false);
    if (editorValue) {
      this.props.handleEditorValueChange(editorValue);
    }
  }

  /** Pre-condition: IAssessment has been loaded */
  private sideContentProps: (p: AssessmentWorkspaceProps, q: number) => SideContentProps = (
    props: AssessmentWorkspaceProps,
    questionId: number
  ) => {
    const tabs: SideContentTab[] = [
      {
        label: `Task ${questionId + 1}`,
        iconName: IconNames.NINJA,
        body: <Markdown content={props.assessment!.questions[questionId].content} />,
        id: SideContentType.questionOverview
      },
      {
        label: `${props.assessment!.category} Briefing`,
        iconName: IconNames.BRIEFCASE,
        body: <Markdown content={props.assessment!.longSummary} />,
        id: SideContentType.briefing
      },
      {
        label: `${props.assessment!.category} Autograder`,
        iconName: IconNames.AIRPLANE,
        body: (
          <SideContentAutograder
            testcases={props.editorTestcases}
            autogradingResults={props.autogradingResults}
            handleTestcaseEval={this.props.handleTestcaseEval}
          />
        ),
        id: SideContentType.autograder
      }
    ];
    const isGraded = props.assessment!.questions[questionId].grader !== undefined;
    if (isGraded) {
      tabs.push({
        label: `Report Card`,
        iconName: IconNames.TICK,
        body: (
          <AssessmentWorkspaceGradingResult
            graderName={props.assessment!.questions[questionId].grader!.name}
            gradedAt={props.assessment!.questions[questionId].gradedAt!}
            xp={props.assessment!.questions[questionId].xp}
            grade={props.assessment!.questions[questionId].grade}
            maxGrade={props.assessment!.questions[questionId].maxGrade}
            maxXp={props.assessment!.questions[questionId].maxXp}
            comments={props.assessment!.questions[questionId].comments}
          />
        ),
        id: SideContentType.grading
      });
    }

    const functionsAttached = props.assessment!.questions[questionId].library.external.symbols;
    if (functionsAttached.includes('get_matrix')) {
      tabs.push({
        label: `Tone Matrix`,
        iconName: IconNames.GRID_VIEW,
        body: <SideContentToneMatrix />,
        id: SideContentType.toneMatrix
      });
    }
    return {
      handleActiveTabChange: props.handleActiveTabChange,
      defaultSelectedTabId: isGraded ? SideContentType.grading : SideContentType.questionOverview,
      tabs
    };
  };

  /** Pre-condition: IAssessment has been loaded */
  private controlBarProps: (q: number) => ControlBarProps = (questionId: number) => {
    const listingPath = `/academy/${assessmentCategoryLink(this.props.assessment!.category)}`;
    const assessmentWorkspacePath = listingPath + `/${this.props.assessment!.id.toString()}`;
    const questionProgress: [number, number] = [
      questionId + 1,
      this.props.assessment!.questions.length
    ];

    const onClickPrevious = () =>
      history.push(assessmentWorkspacePath + `/${(questionId - 1).toString()}`);
    const onClickNext = () =>
      history.push(assessmentWorkspacePath + `/${(questionId + 1).toString()}`);
    const onClickReturn = () => history.push(listingPath);

    // Returns a nullary function that defers the navigation of the browser window, until the
    // student's answer passes some checks - presently only used for Paths
    const onClickProgress = (deferredNavigate: () => void) => {
      return () => {
        // Perform question blocking - determine the highest question number previously accessed
        // by counting the number of questions that have a non-null answer
        const blockedQuestionId =
          this.props.assessment!.questions.filter(qn => qn.answer !== null).length - 1;

        // If the current question does not block the next question, proceed as usual
        if (questionId < blockedQuestionId) {
          return deferredNavigate();
        }
        // Else evaluate its correctness - proceed iff the answer to the current question is correct
        const question: Question = this.props.assessment!.questions[questionId];
        if (question.type === QuestionTypes.mcq) {
          if (question.answer !== (question as IMCQQuestion).solution) {
            return showWarningMessage('Your MCQ solution is incorrect!', 750);
          }
        } else if (question.type === QuestionTypes.programming) {
          const isCorrect = this.props.editorTestcases.reduce((acc, testcase) => {
            return acc && stringify(testcase.result) === testcase.answer;
          }, true);
          if (!isCorrect) {
            return showWarningMessage('Your solution has not passed all testcases!', 750);
          }
        }
        return deferredNavigate();
      };
    };

    const onClickSave = () =>
      this.props.handleSave(
        this.props.assessment!.questions[questionId].id,
        this.props.editorValue!
      );
    const onClickResetTemplate = () => {
      this.setState({ showResetTemplateOverlay: true });
    };

    const clearButton = (
      <ControlBarClearButton
        handleReplOutputClear={this.props.handleReplOutputClear}
        key="clear_repl"
      />
    );

    const evalButton = (
      <ControlBarEvalButton
        handleReplEval={this.props.handleReplEval}
        isRunning={this.props.isRunning}
        key="eval_repl"
      />
    );

    const nextButton = (
      <ControlBarNextButton
        onClickNext={
          this.props.assessment!.category === AssessmentCategories.Path
            ? onClickProgress(onClickNext)
            : onClickNext
        }
        onClickReturn={
          this.props.assessment!.category === AssessmentCategories.Path
            ? onClickProgress(onClickReturn)
            : onClickReturn
        }
        questionProgress={questionProgress}
        key="next_question"
      />
    );

    const previousButton = (
      <ControlBarPreviousButton
        onClick={onClickPrevious}
        questionProgress={questionProgress}
        key="previous_question"
      />
    );

    const questionView = (
      <ControlBarQuestionViewButton questionProgress={questionProgress} key="question_view" />
    );

    const resetButton =
      this.props.assessment!.questions[questionId].type !== QuestionTypes.mcq ? (
        <ControlBarResetButton onClick={onClickResetTemplate} key="reset_template" />
      ) : null;

    const runButton = (
      <ControlBarRunButton handleEditorEval={this.props.handleEditorEval} key="run" />
    );

    const saveButton =
      !beforeNow(this.props.closeDate) &&
      this.props.assessment!.questions[questionId].type !== QuestionTypes.mcq ? (
        <ControlButtonSaveButton
          hasUnsavedChanges={this.props.hasUnsavedChanges}
          onClickSave={onClickSave}
          key="save"
        />
      ) : null;

    const handleChapterSelect = () => {};

    const chapterSelect = (
      <ControlBarChapterSelect
        handleChapterSelect={handleChapterSelect}
        sourceChapter={this.props.assessment!.questions[questionId].library.chapter}
        sourceVariant={Constants.defaultSourceVariant as Variant}
        disabled={true}
        key="chapter"
      />
    );

    return {
      editorButtons: [runButton, saveButton, resetButton, chapterSelect],
      flowButtons: [previousButton, questionView, nextButton],
      replButtons: [evalButton, clearButton]
    };
  };
}

export default AssessmentWorkspace;
