import {BlockViewer} from "aolie_core/src/blockui/uiruntime/BlockViewer";
import {PopulateBean} from "aolie_core/src/decorator/decorator";

export class QueryResult {

    /**
     * 视图
     */
    private viewer: BlockViewer;
    /**
     * 表体信息
     */
    private lstData: Array<object>;

    public getViewer() {
        return this.viewer;
    }

    @PopulateBean(BlockViewer)
    public setViewer(viewer: BlockViewer) {
        this.viewer = viewer;
    }

    public getLstData() {
        return this.lstData;
    }

    public setLstData(lstData: Array<object>) {
        this.lstData = lstData;
    }
}
