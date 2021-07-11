import {QueryResult} from "../modal/QueryResult";
import {CommonUtils} from "aolie_core/src/common/CommonUtils";
import {NetRequest} from "aolie_core/src/common/NetRequest";
import {BeanFactory} from "aolie_core/src/decorator/decorator";
import {Alert} from "aolie_core/src/uidesign/view/JQueryComponent/Alert";

export class TempletQueryService {
    static findCustomQueryResult(templetId, filers: object, callback: (result: QueryResult) => void) {

        CommonUtils.handleResponse(NetRequest.axios.post("/qr/findCustomQueryResult/" + templetId, filers || {}), (result => {
            if (result.success) {
                callback(BeanFactory.populateBean(QueryResult, result.data));
            } else {
                Alert.showMessage("查询出错 ：" + result.err);
                callback(null);
            }
        }));

    }
}
