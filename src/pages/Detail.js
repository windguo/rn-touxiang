/**
 * Created by zhangzuohua on 2018/1/18.
 */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
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
    CameraRoll,
    FlatList
} from 'react-native';
import { ifIphoneX } from '../utils/iphoneX';
import HttpUtil from '../utils/HttpUtil';
import storageKeys from '../utils/storageKeyValue'
import IconSimple from 'react-native-vector-icons/SimpleLineIcons';
import HTMLView from 'react-native-htmlview';
import ImageProgress from 'react-native-image-progress';
import Toast from 'react-native-root-toast';
import { Pie, Bar, Circle, CircleSnail } from 'react-native-progress';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as WeChat from 'react-native-wechat';
const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;
export  default  class Detail extends Component {
    static navigationOptions = {
        title: '详情页',
        header: ({ navigation }) => {
            return (
                <ImageBackground style={{ ...header }} source={require('../assets/backgroundImageHeader.png')} resizeMode='cover'>
                    <TouchableOpacity activeOpacity={1} onPress={() => {
                        navigation.goBack(null);
                    }}>
                        <View style={{ justifyContent: 'center', marginLeft: 10, alignItems: 'center', height: 43.7, width: 20 }}>
                            <IconSimple name="arrow-left" size={20} color='#282828' />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 17, textAlign: 'center', lineHeight: 43.7, color: '#282828' }}>斗图表情宝库详情页</Text>
                    <View style={{ justifyContent: 'center', marginLeft: 10, alignItems: 'center', height: 43.7,width:20 }}>
                        
                    </View>
                </ImageBackground>
            )
        }
    };

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            refreshing: false,
        };
        this.resuleArray = [];
        READ_CACHE(storageKeys.MyCollectList, (res) => {
            if (res && res.length > 0) {
                this.flatList && this.flatList.setData(res, 0);
                this.resuleArray = res;
            }else{
                console.log('nothings');
                this.resuleArray = [];
            }
        })
    }
//this.props.navigation.state.params.data.content && JSON.parse(this.props.navigation.state.params.data.content).content
    componentDidMount() {
        this.loadData();
        this.loadDataRand();
    }
    loadData = async (resolve) => {
        let url = urlConfig.DetailUrl + '&id=' + this.props.navigation.state.params.id;
        console.log('loadUrl', url);
        let res = await HttpUtil.GET(url);
        console.log(res);
        resolve && resolve();
        if (this.props.index !== 0) { this.isNotfirstFetch = true };
        let result = res.result ? res.result : [];
        console.log('result===', result);
        this.setState({
            data: result,
        });
        console.log('res', res);
    };

    //保存图片
    saveImg(img) {
        var promise = CameraRoll.saveToCameraRoll(img);
        promise.then(function (result) {
            Toast.show('保存成功,请到相册查看。', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.CENTER,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
            });
        }).catch(function (error) {
            Toast.show('保存失败！\n' + error, {
                duration: Toast.durations.SHORT,
                position: Toast.positions.CENTER,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
            });
        });
    }
    _keyExtractor = (item, index) => index;

    loadDataRand = async (resolve) => {
        // alert('111');
        let url = urlConfig.sectionListData + '&classid=0';
        console.log('loadDataRand----Url', url);
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
        // console.log('resultresultresultresult:' + result);
        // this.setState(
        //     data = result
        // )
        // console.log(data);
        this.flatList && this.flatList.setData(this.dealWithLongArray(result), 0);
        console.log('res', res);
    };
    clickToShare = (type) => {
        console.log('XXXXXXXXXXXXX', urlConfig.thumbImage);
        this.close();
        WeChat.isWXAppInstalled().then((isInstalled) => {
            if (isInstalled) {
                if (type === 'Session') {
                    WeChat.shareToSession({
                        imageUrl: this.state.data && this.state.data.nurl,
                        titlepicUrl: this.state.data && this.state.data.titlepic,
                        type: 'imageUrl',
                        webpageUrl: urlConfig.DetailUrl + this.state.data.classid + '/' + this.state.data.id
                    }).then((message) => { message.errCode === 0 ? this.ToastShow('分享成功') : this.ToastShow('分享失败') }).catch((e) => {
                        if (error.message != -2) {
                            Toast.show(error.message);
                        }
                    });
                } else {
                    WeChat.shareToTimeline({
                        imageUrl: this.state.data && this.state.data.nurl,
                        type: 'imageUrl',
                        webpageUrl: urlConfig.DetailUrl + this.state.data.classid + '/' + this.state.data.id
                    }).then((message) => { message.errCode === 0 ? this.ToastShow('分享成功') : this.ToastShow('分享失败') }).catch((error) => {
                        if (error.message != -2) {
                            Toast.show(error.message);
                        }
                    });
                }
            } else {
            }
        });
    }
    show = (item) => {
        this.state.data = item;
        if (Platform.OS === 'android') {
            this.share()
            return;
        }
        this._ViewHeight.setValue(0);
        this.setState({
            visible: true
        }, Animated.timing(this._ViewHeight, {
            fromValue: 0,
            toValue: 140, // 目标值
            duration: 200, // 动画时间
            easing: Easing.linear // 缓动函数
        }).start());
    };
    close = () => {
        this.setState({
            visible: false
        });
    };
    share = async () => {
        let data = await NativeModules.NativeUtil.showDialog();
        if (data.wechat === 3) {
            this.clickToReport();
            return;
        }
        if (data) {
            WeChat.isWXAppInstalled().then((isInstalled) => {
                if (isInstalled) {
                    if (data.wechat === 1) {
                        WeChat.shareToSession({
                            imageUrl: this.state.data && this.state.data.nurl,
                            titlepicUrl: this.state.data && this.state.data.titlepic,
                            type: 'imageUrl',
                            webpageUrl: urlConfig.DetailUrl + this.state.data.classid + '/' + this.state.data.id
                        }).then((message) => { message.errCode === 0 ? this.ToastShow('分享成功') : this.ToastShow('分享失败') }).catch((error) => {
                            if (error.message != -2) {
                                Toast.show(error.message);
                            }
                        });
                    } else if (data.wechat === 2) {
                        WeChat.shareToSession({
                            imageUrl: this.state.data && this.state.data.nurl,
                            titlepicUrl: this.state.data && this.state.data.titlepic,
                            type: 'imageUrl',
                            webpageUrl: urlConfig.DetailUrl + this.state.data.classid + '/' + this.state.data.id
                        }).then((message) => { message.errCode === 0 ? this.ToastShow('分享成功') : this.ToastShow('分享失败') }).catch((error) => {
                            if (error.message != -2) {
                                Toast.show(error.message);
                            }
                        });
                    }
                } else {
                    Toast.show("没有安装微信软件，请您安装微信之后再试");
                }
            });
            console.log('data', data)
        }
    };
    clickToReport = () => {
        let url = urlConfig.ReportURL + '/' + this.state.data.classid + '/' + this.state.data.id;
        this.props.navigation.navigate('Web', { url: url });
        this.close();
    }
    

    clickToFava = () =>{
        let resu = {
            title: this.state.data.title,
            id: this.state.data.id,
            classid: this.state.data.classid,
            nurl: this.state.data.nurl,
            titlepic: this.state.data.titlepic,
        };
        this.resuleArray.push(resu);
        WRITE_CACHE(storageKeys.MyCollectList, this.resuleArray);
        Toast.show('本地收藏【' + this.state.data.title + '】成功,\n请到本地表情查看。', {
            duration: Toast.durations.SHORT,
            position: Toast.positions.CENTER,
            shadow: true,
            animation: true,
            hideOnPress: true,
            delay: 0,
        });
        // READ_CACHE(storageKeys.MyCollectList, (res) => {
        //     console.log('===res===', res);
        //     return false;
        //     if (res && res.length > 0) {
        //         this.setState({ sectionList: res });
        //     } else {
        //     }
        // }, (err) => {
        // });
    }
    render() {
        return (
            <View>
                <ScrollView>
                    <View style={{ 
                        padding: 20, 
                        marginTop: StyleSheet.hairlineWidth,
                        marginBottom: StyleSheet.hairlineWidth
                        }}>
                        <View style={{alignItems: 'center', justifyContent: 'center',paddingTop:10}}>
                            <Text style={{ fontSize: 20 }}>
                                {this.state.data.title}
                            </Text>
                        </View>
                        {this.state.data.nurl ? <ImageProgress
                            source={{ uri: this.state.data.nurl }}
                            resizeMode={'center'}
                            style={{ width: WIDTH - 40, height: 100 }} /> : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:'center' }}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', marginLeft: 10 }}
                            onPress={() => this.clickToShare('Session')}
                        >
                            <View style={styles.shareContent}>
                                <Icon name="weixin" size={40} color='#f60' />
                                <Text style={styles.spinnerTitle}>微信好友</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.clickToFava()}
                            hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}
                            style={{ flexDirection: 'row', marginLeft: 10 }}
                        >
                            <View style={styles.shareContent}>
                                <Icon name="folder-open-o" size={40} color='#6cbcff' />
                                <Text style={styles.spinnerTitle}>收藏表情</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={this.saveImg.bind(this, this.state.data.nurl)}
                            hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}
                            style={{ flexDirection: 'row', marginLeft: 10 }}
                        >
                            <View style={styles.shareContent}>
                                <MaterialIcons name="add-to-photos" size={40} color='#fa7b3d' />
                                <Text style={styles.spinnerTitle}>保存到相册</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', marginLeft: 10 }}
                            onPress={() => this.clickToReport()}
                        >
                            <View style={styles.shareContent}>
                                <IconSimple name="exclamation" size={40} color='#fe96aa' />
                                <Text style={styles.spinnerTitle}>举报</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const htmlStyles = StyleSheet.create({
    p: {
        fontSize: 16,
        lineHeight: 30
    },
});

const header = {
    backgroundColor: '#C7272F',
    ...ifIphoneX({
        paddingTop: 44,
        height: 88
    }, {
            paddingTop: Platform.OS === "ios" ? 20 : SCALE(StatusBarHeight()),
            height: 64,
        }),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
}

const styles = StyleSheet.create({
    shareParent: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 10
    },
    shareContent: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    shareIcon: {
        width: 40,
        height: 40
    },
    spinnerTitle:{
        paddingTop: 10
    }
    
})




