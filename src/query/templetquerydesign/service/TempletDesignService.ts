import { CommonUtils } from "aolie_core/src/common/CommonUtils";
import { NetRequest } from "aolie_core/src/common/NetRequest";
import { BeanFactory } from "aolie_core/src/decorator/decorator";
import { QrTempletQuery } from "../dto/QrTempletQuery";
import { HandleResult } from "aolie_core/src/common/HandleResult";
import { Alert } from "aolie_core/src/uidesign/view/JQueryComponent/Alert";


export class TempletDesignService {


    static findTempQuery(tempId, callback) {
        CommonUtils.handleResponse(NetRequest.axios.get("/qr/findTempletQuery/" + tempId), (result => {
            if (result.success) {
                callback(BeanFactory.populateBean(QrTempletQuery, result.data));
            } else {
                Alert.showMessage("查询出错 ：" + result.err);
                callback(null);
            }
        }));
    }

    /**
     * 保存列明细
     * @param tempId
     * @param lstDetail
     * @param callback
     */
    static saveDetail(tempId, lstDetail, callback: (result: HandleResult) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/qr/saveTempletDetail/" + tempId, lstDetail), (result => {
            callback(result);
        }));
    }
}
