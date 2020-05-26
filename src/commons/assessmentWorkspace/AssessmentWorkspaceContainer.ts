import { connect, MapDispatchToProps, MapStateToProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import {
  beginDebuggerPause,
  beginInterruptExecution,
  debuggerReset,
  debuggerResume
} from 'src/commons/application/actions/InterpreterActions';
import { fetchAssessment, submitAnswer } from 'src/commons/application/actions/SessionActions';
import { IState, IWorkspaceState } from 'src/commons/application/ApplicationTypes';
import { Library } from 'src/commons/assessment/AssessmentTypes';
import { Position } from 'src/commons/editor/EditorTypes';
import { SideContentType } from 'src/commons/sideContent/SideContentTypes';
import {
  beginClearContext,
  browseReplHistoryDown,
  browseReplHistoryUp,
  changeEditorHeight,
  changeEditorWidth,
  changeSideContentHeight,
  chapterSelect,
  clearReplOutput,
  evalEditor,
  evalRepl,
  evalTestcase,
  navigateToDeclaration,
  promptAutocomplete,
  resetWorkspace,
  setEditorBreakpoint,
  updateActiveTab,
  updateCurrentAssessmentId,
  updateEditorValue,
  updateHasUnsavedChanges,
  updateReplValue
} from 'src/commons/workspace/WorkspaceActions';
import { WorkspaceLocation } from 'src/commons/workspace/WorkspaceTypes';

import AssessmentWorkspace, {
  DispatchProps,
  OwnProps,
  StateProps
} from './AssessmentWorkspaceComponent';

const mapStateToProps: MapStateToProps<StateProps, OwnProps, IState> = (state, props) => {
  return {
    assessment: state.session.assessments.get(props.assessmentId),
    autogradingResults: state.workspaces.assessment.autogradingResults,
    editorPrepend: state.workspaces.assessment.editorPrepend,
    editorValue: state.workspaces.assessment.editorValue,
    editorPostpend: state.workspaces.assessment.editorPostpend,
    editorTestcases: state.workspaces.assessment.editorTestcases,
    editorHeight: state.workspaces.assessment.editorHeight,
    editorWidth: state.workspaces.assessment.editorWidth,
    breakpoints: state.workspaces.assessment.breakpoints,
    highlightedLines: state.workspaces.assessment.highlightedLines,
    hasUnsavedChanges: state.workspaces.assessment.hasUnsavedChanges,
    isRunning: state.workspaces.assessment.isRunning,
    isDebugging: state.workspaces.assessment.isDebugging,
    enableDebugging: state.workspaces.assessment.enableDebugging,
    newCursorPosition: state.workspaces.assessment.newCursorPosition,
    output: state.workspaces.assessment.output,
    replValue: state.workspaces.assessment.replValue,
    sideContentHeight: state.workspaces.assessment.sideContentHeight,
    storedAssessmentId: state.workspaces.assessment.currentAssessment,
    storedQuestionId: state.workspaces.assessment.currentQuestion
  };
};

const workspaceLocation: WorkspaceLocation = 'assessment';

const mapDispatchToProps: MapDispatchToProps<DispatchProps, {}> = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      handleActiveTabChange: (activeTab: SideContentType) =>
        updateActiveTab(activeTab, workspaceLocation),
      handleAssessmentFetch: fetchAssessment,
      handleBrowseHistoryDown: () => browseReplHistoryDown(workspaceLocation),
      handleBrowseHistoryUp: () => browseReplHistoryUp(workspaceLocation),
      handleChapterSelect: (chapter: any, changeEvent: any) =>
        chapterSelect(chapter, 'default', workspaceLocation),
      handleClearContext: (library: Library) => beginClearContext(library, workspaceLocation),
      handleDeclarationNavigate: (cursorPosition: Position) =>
        navigateToDeclaration(workspaceLocation, cursorPosition),
      handleEditorEval: () => evalEditor(workspaceLocation),
      handleEditorValueChange: (val: string) => updateEditorValue(val, workspaceLocation),
      handleEditorHeightChange: (height: number) => changeEditorHeight(height, workspaceLocation),
      handleEditorWidthChange: (widthChange: number) =>
        changeEditorWidth(widthChange.toString(), workspaceLocation),
      handleEditorUpdateBreakpoints: (breakpoints: string[]) =>
        setEditorBreakpoint(breakpoints, workspaceLocation),
      handleInterruptEval: () => beginInterruptExecution(workspaceLocation),
      handleReplEval: () => evalRepl(workspaceLocation),
      handleReplOutputClear: () => clearReplOutput(workspaceLocation),
      handleReplValueChange: (newValue: string) => updateReplValue(newValue, workspaceLocation),
      handleResetWorkspace: (options: Partial<IWorkspaceState>) =>
        resetWorkspace(workspaceLocation, options),
      handleSave: submitAnswer,
      handleSideContentHeightChange: (heightChange: number) =>
        changeSideContentHeight(heightChange, workspaceLocation),
      handleTestcaseEval: (testcaseId: number) => evalTestcase(workspaceLocation, testcaseId),
      handleUpdateHasUnsavedChanges: (hasUnsavedChanges: boolean) =>
        updateHasUnsavedChanges(workspaceLocation, hasUnsavedChanges),
      handleUpdateCurrentAssessmentId: updateCurrentAssessmentId,
      handleDebuggerPause: () => beginDebuggerPause(workspaceLocation),
      handleDebuggerResume: () => debuggerResume(workspaceLocation),
      handleDebuggerReset: () => debuggerReset(workspaceLocation),
      handlePromptAutocomplete: (row: number, col: number, callback: any) =>
        promptAutocomplete(workspaceLocation, row, col, callback)
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AssessmentWorkspace);
