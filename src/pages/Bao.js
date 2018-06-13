/**
 * Created by zhangzuohua on 2018/1/22.
 */
import React, { Component } from 'react';
import {
    StyleSheet,
    Image,
    Text,
    Linking,
    View,
    Dimensions,
    Animated,
    Easing,
    PanResponder,
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    InteractionManager,
    BackHandler,
    ScrollView,
    TouchableWithoutFeedback,
    RefreshControl,
    DeviceEventEmitter,
    LayoutAnimation,
    NativeModules,
    ImageBackground,
    FlatList,
    Clipboard
} from 'react-native';
import urlConfig from '../utils/urlConfig';
import ModalUtil from '../utils/modalUtil';
import formatData from '../utils/formatData';
import Toast from 'react-native-root-toast';
import LoadError from '../components/loadError';
const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;
import PullList from '../components/pull/PullList'
import storageKeys from '../utils/storageKeyValue'

import IconSimple from 'react-native-vector-icons/SimpleLineIcons';
import HttpUtil from '../utils/HttpUtil';
import ImageProgress from 'react-native-image-progress';
import { Pie, Bar, Circle, CircleSnail } from 'react-native-progress';
import AutoHeightImage from 'react-native-auto-height-image';
import CustomImage from '../components/CustomImage'
import GuessText from '../components/GuessText'
export default class Home extends Component {
    static navigationOptions = {
    };
    constructor(props) {
        super(props);
        this.state = {
            refreshing: false,
            loadError: false,
            loadNewData: false,
            visible: false,
            ViewHeight: new Animated.Value(0)
        };
        //每次请求需要需要加pagenumber
        this.requestPageNumber = 1;
    }
    componentWillMount() {
        this._ViewHeight = new Animated.Value(0);
    }
    componentDidMount() {
        this.refTextArray = [];
        this.subscription = DeviceEventEmitter.addListener('reloadData', this.refreshing);
        InteractionManager.runAfterInteractions(() => {
            this.loadData();
        });
    }
    componentWillUnmount() {
        this.subscription.remove();
    }
    setClipboardContent = (text, index, item) => {
        if (item.classid === '41' || item.classid === '44' || item.classid === '39') {
            return;
        }
        try {
            let DeepCopyData = [].concat(JSON.parse(JSON.stringify(this.FlatListData)));
            DeepCopyData[index].isCopyed = true;
            this.flatList.setData(DeepCopyData);
            Clipboard.setString(item.title && item.title.replace(/^(\r\n)|(\n)|(\r)/, "") + urlConfig.DetailUrl + item.classid + '/' + item.id);
            Toast.show('复制成功', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.CENTER,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
            });
        } catch (e) { }
    }
    clickToFavas = (classid, id) => {
        let url = urlConfig.FavasURL + '/' + classid + '/' + id;
        this.props.navigation.navigate('Web', { url: url });
    }

    dealWithrequestPage = () => {
        return this.requestPageNumber > 1 ? '&page=' + this.requestPageNumber : ''
    }
    loadData = async (resolve) => {
        let url = '';
        if (!this.props.data) {
            return;
        }
        switch (this.props.data.classid) {
            case '0':
                url = urlConfig.sectionListDataBiaoqingbao + '&classid=' + this.props.data.classid;
                break;
            default:
                url = this.isNotfirstFetch ? urlConfig.sectionListDataBiaoqingbao + '&classid=' + this.props.data.classid : urlConfig.sectionListDataBiaoqingbao + '&classid=' + this.props.data.classid;
        }
        console.log('loadUrl', url);
        let res = await HttpUtil.GET(url);
        resolve && resolve();
        if (!res || !res.result) {
            READ_CACHE(storageKeys.homeList + 'page' + this.props.index, (res) => {
                if (res && res.length > 0) {
                    this.flatList && this.flatList.setData(res, 0);
                    this.FlatListData = res;
                } else { }
            }, (err) => {
            });
            return;
        }
        if (this.props.index !== 0) { this.isNotfirstFetch = true };
        let result = res.result ? res.result : [];
        WRITE_CACHE(storageKeys.homeList + 'page' + this.props.index, result);
        this.flatList && this.flatList.setData(this.dealWithLongArray(result), 0);
        console.log('res', res);
    };
    dealWithLongArray = (dataArray) => {
        //下拉刷新来几条数据，就对应的删除几条数据 ，以便填充
        let initArray = [];
        if (this.FlatListData) {
            if (this.FlatListData.length > dataArray.length) {
                initArray = this.FlatListData.slice(dataArray.length, this.FlatListData.length);
            } else {
                initArray = [];
            }
        }
        let waitDealArray = dataArray.concat(initArray).filter((value) => { return !(!value || value === ""); });
        if (waitDealArray.length >= 50) {
            waitDealArray = waitDealArray.slice(0, 50);
            console.log('处理过的array', waitDealArray);
        }
        this.FlatListData = waitDealArray;
        return waitDealArray;
    }
    dealWithLoadMoreData = (dataArray) => {
        console.log('loadMoreData', dataArray);
        let waitDealArray = this.FlatListData.concat(dataArray).filter((value) => { return !(!value || value === ""); });
        console.log('loadMoreDatacontact', waitDealArray);
        if (waitDealArray.length >= 50) {
            waitDealArray = waitDealArray.slice(waitDealArray.length - 50, waitDealArray.length);
            console.log('处理过的array', waitDealArray);
        }
        this.FlatListData = waitDealArray;
        return waitDealArray;
    }
    refreshing = () => {
        if (this.props.index === global.activeTab) {
            this.flatList.scrollToOffset({ offset: 0, animated: true });
            this.flatList.BeginRefresh();
        }
    }
    ToastShow = (message) => {
        Toast.show(message, {
            duration: Toast.durations.SHORT,
            position: Toast.positions.CENTER,
            shadow: true,
            animation: true,
            hideOnPress: true,
            delay: 0,
        });
    }
    navigateToDetail = () => {
        this.props.navigation.navigate('Detail', { data: this.state.data[index] });
    }
    PostThumb = async (item, dotop, index) => {
        try {
            let upDownData = [].concat(JSON.parse(JSON.stringify(this.FlatListData)));
            if (dotop === 0) {
                upDownData[index].isUnLike = true;
                upDownData[index].diggbot = (parseInt(upDownData[index].diggbot) - 1).toString();

            }
            if (dotop === 1) {
                upDownData[index].isLike = true;
                upDownData[index].diggtop = (parseInt(upDownData[index].diggtop) + 1).toString();
            }

            let url = '';
            if (dotop === 0) {
                url = urlConfig.thumbDownUrl;
            } else if (dotop === 1) {
                url = urlConfig.thumbUpUrl;
            }
            //不用formdate后台解析不出来
            let formData = new FormData();
            formData.append("id", item.id);
            formData.append("classid", item.classid);
            formData.append("dotop", '' + dotop);
            formData.append("doajax", '' + 1);
            formData.append("ajaxarea", "diggnum");
            let res = await HttpUtil.POST(url, formData, 'dotop');
            if (!res) {
                return;
            }
            let message = '';
            let array = res._bodyInit.split('|');
            if (array.length > 0) {
                message = array[array.length - 1];
            }
            if (message === '谢谢您的支持' || message === '谢谢您的意见') {
                this.flatList.setData(upDownData);
                //只能操作数据源修改列表数据  很大的损耗啊
                this.FlatListData = upDownData;
            }
            this.ToastShow(message);
        } catch (e) { }
    }
    renderTextAndImage = (item, index) => {
        return <View>
            <View>
                <Text activeOpacity={0.8} onPress={() => {
                    this.props.navigation.navigate('Detail', { id: item.id, title: item.title, titlepic: item.titlepic, classid: item.classid });
                }} style={{ fontSize: 18, paddingBottom: 10 }}>{item.title}</Text>
            </View>
            <Text activeOpacity={0.8} onPress={() => {
                this.props.navigation.navigate('Detail', { id: item.id, title: item.title, titlepic: item.titlepic, classid: item.classid });
            }} style={{ lineHeight: 26, fontSize: 16, color: '#555' }}>
                {item.titlepic ? <ImageProgress
                    source={{ uri: item.titlepic }}
                    resizeMode={'center'}
                    indicator={Pie}
                    indicatorProps={{
                        size: 30,
                        borderWidth: 0,
                        color: 'rgba(255, 160, 0, 0.8)',
                        unfilledColor: 'rgba(200, 200, 200, 0.1)'
                    }}
                    style={{ width: WIDTH - 40, height: 50 }}
                /> : null}
            </Text>
        </View>
    }
    pushToUrls = (url) => {
        if (url) {
            Linking.openURL(url)
                .catch((err) => {
                    console.log('An error occurred', err);
                });
        }
    }
    _renderItem = ({ item, index }) => {
        <TouchableOpacity activeOpacity={1} onPress={() => {
        }}>
            <View>
                {index === 0 ? <View style={{ width: WIDTH, height: 10, backgroundColor: Color.f5f5f5 }} /> : <View />}
                <View style={{ backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 20 }}>
                    {this.renderTextAndImage(item, index)}
                </View>
            </View>
        </TouchableOpacity>
    }
    onPullRelease = async (resolve) => {
        this.loadData(resolve);
    };
    loadMore = async () => {
        let url = '';
        this.requestPageNumber += 1;
        if (!this.props.data) {
            return;
        }
        switch (this.props.data.classid) {
            case '0':
                url = urlConfig.sectionListDataBiaoqingbao + '&classid=' + this.props.data.classid + this.dealWithrequestPage();
                break;
            default:
                url = this.isNotfirstFetch ? urlConfig.sectionListDataBiaoqingbao + '&classid=' + this.props.data.classid + this.dealWithrequestPage() : urlConfig.sectionListDataBiaoqingbao + '&classid=' + this.props.data.classid + this.dealWithrequestPage();

        }
        let res = await HttpUtil.GET(url);
        if (!res || !res.result) {
            return;
        }
        let result = res.result ? res.result : [];
        this.flatList && this.flatList.setData(this.dealWithLoadMoreData(result));
        console.log('res', res);
    };
    _keyExtractor = (item, index) => index;
    render() {
        return (
            <View style={{ flex: 1 }} >
                <PullList
                    keyExtractor={this._keyExtractor}
                    onPullRelease={this.onPullRelease}
                    renderItem={this._renderItem}
                    onEndReached={this.loadMore}
                    style={{ backgroundColor: Color.f5f5f5 }}
                    ref={(c) => { this.flatList = c }}
                    ifRenderFooter={true}
                />
            </View>
        );
    }
}
const styles = StyleSheet.create({
    base: {
        flex: 1
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#FFF'
    },
    spinner: {
        width: WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)'
    },
    spinnerContent: {
        justifyContent: 'center',
        width: WIDTH,
        backgroundColor: '#fcfcfc',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    spinnerTitle: {
        fontSize: 14,
        color: '#313131',
        textAlign: 'center',
        marginTop: 5
    },
    shareParent: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 10
    },
    shareContent: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    shareIcon: {
        width: 40,
        height: 40
    }
});