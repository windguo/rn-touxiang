
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
import * as WeChat from 'react-native-wechat';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconSimple from 'react-native-vector-icons/SimpleLineIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import HttpUtil from '../utils/HttpUtil';
import ImageProgress from 'react-native-image-progress';
import { Pie, Bar, Circle, CircleSnail } from 'react-native-progress';
import { ifIphoneX } from '../utils/iphoneX';
import AutoHeightImage from 'react-native-auto-height-image';
import CustomImage from '../components/CustomImage'
import GuessText from '../components/GuessText'
export default class MyCollectLaugh extends Component {
    static navigationOptions = {
        tabBarLabel: '本地收藏',
        tabBarIcon: ({ tintColor, focused }) => (
            <IconSimple name="folder-alt" size={22} color={focused ? "#f60" : 'black'} />
        ),
        header: ({ navigation }) => {
            return (
                <ImageBackground style={{ ...header }} source={require('../assets/backgroundImageHeader.png')} resizeMode='cover'>
                    <TouchableOpacity activeOpacity={1} onPress={() => {
                        navigation.goBack(null);
                    }}>
                        <View style={{ justifyContent: 'center', marginLeft: 10, alignItems: 'center', height: 43.7 }}>

                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 17, textAlign: 'center', fontWeight: '300', lineHeight: 43.7, color: '#282828' }}>本地收藏</Text>
                    <TouchableOpacity activeOpacity={1} onPress={() => {
                    }}>
                        <View style={{ justifyContent: 'center', marginRight: 10, alignItems: 'center', height: 43.7, backgroundColor: 'transparent', width: 20 }}>
                        </View>
                    </TouchableOpacity>
                </ImageBackground>
            )
        }
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
        console.log('=======');
        // this.readCaache();
        this.viewDidAppear = this.props.navigation.addListener(
            'didFocus',
            (obj) => {
                // console.log('123456789====');
                // console.log(obj);
                this.readCaache();
            }
        );


    }

    readCaache = () => {
        READ_CACHE(storageKeys.MyCollectList, (res) => {
            if (res && res.length > 0) {
                this.setState({ sectionList: res });
                InteractionManager.runAfterInteractions(() => {
                    this.flatList && this.flatList.setData(res, 0);
                });
                
            } else {
                console.log('readCaache-res-length<0');
                this.setState({ sectionList: [] });
                InteractionManager.runAfterInteractions(() => {
                    this.flatList && this.flatList.setData([], 0);
                });
                // 
            };
        }, (err) => {
            if (err.name == 'NotFoundError') {
                console.log('没存数据啊');
                InteractionManager.runAfterInteractions(() => {
                    this.flatList && this.flatList.setData(this.dealWithLongArray([]), 0);
                });
                this.setState({ sectionList: [] });
            }
        });
        
    }
    componentWillUnmount() {
    }
    dealWithrequestPage = () => {
        return this.requestPageNumber > 1 ? '&page=' + this.requestPageNumber : ''
    }

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
        // let waitDealArray = this.state.data.concat(dataArray);
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
    clickToFavas = (classid, id) => {
        let url = urlConfig.FavasURL + '/' + classid + '/' + id;
        this.props.navigation.navigate('Web', { url: url });
    }
    renderTextAndImage = (item, index) => {
        return <View>
            <View>
                <Text activeOpacity={0.8} onPress={() => {
                    this.props.navigation.navigate('Detail', { id: item.id, title: item.title, nurl: item.nurl, classid: item.classid });
                }} style={{ fontSize: 18, paddingBottom: 10 }}>{item.title}</Text>
            </View>
            <Text activeOpacity={0.8} onPress={() => {
                this.props.navigation.navigate('Detail', { id: item.id, title: item.title, nurl: item.nurl, classid: item.classid });
            }} style={{ lineHeight: 26, fontSize: 16, color: '#555' }}>
                {item.nurl ? <ImageProgress
                    source={{ uri: item.nurl }}
                    resizeMode={'center'}
                    indicator={Pie}
                    indicatorProps={{
                        size: 40,
                        borderWidth: 0,
                        color: 'rgba(255, 160, 0, 0.8)',
                        unfilledColor: 'rgba(200, 200, 200, 0.1)'
                    }}
                    style={{ width: WIDTH - 40, height: 100 }} /> : null}
            </Text>
        </View>
    }

    removeStorage = (item) => {
        console.log('2222=item.id===', item.id);
        READ_CACHE(storageKeys.MyCollectList, (res) => {
            console.log('2222=1234554====', res);
            res = res.filter(function (x) {
                if (x.id == item.id) {
                    console.log('resresresres====', res);
                    return false;
                }else{
                    return true;
                };
            });
            WRITE_CACHE(storageKeys.MyCollectList, res);
            Toast.show('移除标题是【' + item.title + '】的表情成功', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.CENTER,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
            });
            this.readCaache();
        }, (err) => {
            if (err.name == 'NotFoundError') {
                console.log('222222没存数据啊');
                InteractionManager.runAfterInteractions(() => {
                    this.flatList && this.flatList.setData(this.dealWithLongArray([]), 0);
                });
                this.setState({ sectionList: [] });
            }
        });
        
        //;
        // alert('全部移除了');
    }

    _renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {
            }}>
                <View>
                    {index === 0 ? <View style={{ width: WIDTH, height: 10, backgroundColor: Color.f5f5f5 }} /> : <View />}
                    <View style={{ backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 20 }}>
                        {this.renderTextAndImage(item, index)}
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 15,
                                marginBottom: 15,
                                justifyContent: 'space-between'
                            }}>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity activeOpacity={1}
                                    onPress={() => {
                                        this.removeStorage(item);
                                    }}
                                    hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                    <Text style={{ color: '#c30' }}>移出收藏</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
    _keyExtractor = (item, index) => index;
    render() {
        return (
            <View style={{ flex: 1 }} >
                <PullList
                    //  data={this.state.data}
                    keyExtractor={this._keyExtractor}
                    // onPullRelease={this.onPullRelease}
                    renderItem={this._renderItem}
                    // onEndReached={this.loadMore}
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