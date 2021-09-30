import React, { useEffect, useState } from 'react';
import { FlatList, View, Image, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RNS3 } from 'react-native-aws3';
import * as ImagePicker from 'expo-image-picker';

 const Home = () =>  {

  const [isLoading, setLoading] = useState(true);
  const [isUploding, setUploding] = useState(false);
  const [data, setData] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    // action on update of photoUrl
    if (photoUrl) {
      uploadImageToS3Bucket();
    }
  }, [photoUrl]);

  const [fileCount, setFleCount] = useState(1);

  const file = {
    uri: photoUrl,
    name: "image" + fileCount + ".png",
    type: "image/png"
  }
   
  const options = {
    keyPrefix: "images/",
    bucket: "zignuts-shared",
    region: "",//Replace with account region
    accessKey: "", //Replace with youar account accessKey
    secretKey: "",//Replace with youar account secretKey
    successActionStatus: 201
  }

  const apiTogetImagesFromS3 = 'https://yc8w5zownd.execute-api.ap-south-1.amazonaws.com/dev/images/get';
  const apiTouploadImageConfirmation = 'https://yc8w5zownd.execute-api.ap-south-1.amazonaws.com/dev/images/post';

  useEffect(() => {
    getlistImages();
      (async () => {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Sorry, we need camera roll permissions to make this work!');
          }
        }
      })();
  }, []);

  function getlistImages() {
    fetch(apiTogetImagesFromS3)
      .then((response) => response.json())
      .then((json) => {
        setData(json);
        setFleCount(json.data.length + 1);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setLoading(false)
        setUploding(false)
      });
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setPhotoUrl(result.uri);
    }
  };

  async function uploadImageToS3Bucket() {
    setUploding(true)
    RNS3.put(file, options).then(response => {
      if (response.status !== 201) {
        throw new Error("Failed to upload image to S3");
      }
      if (response.status === 201) {
        fetch(apiTouploadImageConfirmation, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: "image" + fileCount + ".png"
            })
          }).then((response) => response.json())
          .then((json) => {
            // setData([]);
            getlistImages(); 
          })
          .catch((error) => console.error(error))
          .finally(() => setLoading(false));
      }
    });
  }

  const Item = ({ path}) => (
    <View style={styles.card}>
          <Image style={styles.cardImage} source={{uri:path}}/>
    </View>
  );

  const renderItem = ({ item , index}) => <Item path={item.path}/>;
  
  return (
    <View style={{ flex: 1 }}>
      { isLoading ? 
      <View style={{ flex: 1 , justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View> : 
      <View style={styles.container}>
      {isUploding ? <View style={{ flex: 1 , justifyContent: 'center', alignItems: 'center'}}> 
        <ActivityIndicator size="large" color="#0000ff"  style={{  justifyContent: 'center', alignItems: 'center'}}/>
        </View> : 
        <FlatList style={styles.list}
          contentContainerStyle={styles.listContainer}
          data={data.data}
          horizontal={false}
          numColumns={2}
          ItemSeparatorComponent={() => {
            return (
              <View style={styles.separator}/>
            )
          }}
          renderItem={renderItem}
          decelerationRate="fast"
      /> 
     }
      <Button title="Pick an image to upload" onPress={pickImage} />
  </View>}
  </View>
  );
};

const styles = StyleSheet.create({
  container:{
    flex:1,
    marginTop:20,
    backgroundColor:"#eee"
  },
  list: {
    paddingHorizontal: 5,
    backgroundColor:"#E6E6E6",
  },
  listContainer:{
    alignItems:'center'
  },
  separator: {
    marginTop: 10,
  },
  
  card:{
    marginVertical: 8,
    flexBasis: '47%',
    marginHorizontal: 5,
  },
  cardContent: {
    paddingVertical: 12.5,
    paddingHorizontal: 16,
  },
  cardFooter:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12.5,
    paddingBottom: 25,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  cardImage:{
    flex: 1,
    height: 150,
    width: null,
  },
  
  share:{
    color: "#25b7d3",
  },
  icon: {
    width:25,
    height:25,
  },
  
  socialBarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1
  },
  socialBarSection: {
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  socialBarlabel: {
    marginLeft: 8,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  socialBarButton:{
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 

export default Home;