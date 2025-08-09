import { supabase } from "@/lib/supabaseClient";

export interface DisplaySettings extends Record<string, boolean> {
  show_symbol: boolean;
  show_direction: boolean;
  show_entry_price: boolean;
  show_exit_price: boolean;
  show_entry_time: boolean;
  show_exit_time: boolean;
  show_hold_time: boolean;
  show_emotion: boolean;
  show_tag: boolean;
  show_lot: boolean;
  show_pips: boolean;
  show_profit: boolean;
  show_note: boolean;
}

export const defaultDisplaySettings: DisplaySettings = {
  show_symbol: true,
  show_direction: true,
  show_entry_price: true,
  show_exit_price: true,
  show_entry_time: true,
  show_exit_time: true,
  show_hold_time: true,
  show_emotion: true,
  show_tag: true,
  show_lot: true,
  show_pips: true,
  show_profit: true,
  show_note: true,
};

export const loadDisplaySettings = async (userId: string): Promise<DisplaySettings> => {
  if (!userId) return defaultDisplaySettings;
  
  try {
    const { data, error } = await supabase
      .from("trade_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error loading display settings:", error);
      return defaultDisplaySettings;
    }
    
    if (data) {
      return {
        show_symbol: data.show_symbol ?? true,
        show_direction: data.show_direction ?? true,
        show_entry_price: data.show_entry_price ?? true,
        show_exit_price: data.show_exit_price ?? true,
        show_entry_time: data.show_entry_time ?? true,
        show_exit_time: data.show_exit_time ?? true,
        show_hold_time: data.show_hold_time ?? true,
        show_emotion: data.show_emotion ?? true,
        show_tag: data.show_tag ?? true,
        show_lot: data.show_lot ?? true,
        show_pips: data.show_pips ?? true,
        show_profit: data.show_profit ?? true,
        show_note: data.show_note ?? true,
      };
    }
    
    return defaultDisplaySettings;
  } catch (error) {
    console.error("Error loading display settings:", error);
    return defaultDisplaySettings;
  }
};

export const saveDisplaySettings = async (userId: string, settings: DisplaySettings): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Check if settings exist for this user
    const { data: existingSettings, error: checkError } = await supabase
      .from("trade_settings")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing settings:", checkError);
      return false;
    }
    
    const settingsData = {
      user_id: userId,
      show_symbol: settings.show_symbol,
      show_direction: settings.show_direction,
      show_entry_price: settings.show_entry_price,
      show_exit_price: settings.show_exit_price,
      show_entry_time: settings.show_entry_time,
      show_exit_time: settings.show_exit_time,
      show_hold_time: settings.show_hold_time,
      show_emotion: settings.show_emotion,
      show_tag: settings.show_tag,
      show_lot: settings.show_lot,
      show_pips: settings.show_pips,
      show_profit: settings.show_profit,
      show_note: settings.show_note,
      updated_at: new Date().toISOString(),
    };
    
    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("trade_settings")
        .update(settingsData)
        .eq("user_id", userId);
      
      if (updateError) {
        console.error("Error updating display settings:", updateError);
        return false;
      }
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from("trade_settings")
        .insert([{
          ...settingsData,
          created_at: new Date().toISOString(),
        }]);
      
      if (insertError) {
        console.error("Error inserting display settings:", insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error saving display settings:", error);
    return false;
  }
};

// Helper function to convert Record<string, boolean> to DisplaySettings
export const convertToDisplaySettings = (settings: Record<string, boolean>): DisplaySettings => {
  return {
    show_symbol: settings.show_symbol ?? true,
    show_direction: settings.show_direction ?? true,
    show_entry_price: settings.show_entry_price ?? true,
    show_exit_price: settings.show_exit_price ?? true,
    show_entry_time: settings.show_entry_time ?? true,
    show_exit_time: settings.show_exit_time ?? true,
    show_hold_time: settings.show_hold_time ?? true,
    show_emotion: settings.show_emotion ?? true,
    show_tag: settings.show_tag ?? true,
    show_lot: settings.show_lot ?? true,
    show_pips: settings.show_pips ?? true,
    show_profit: settings.show_profit ?? true,
    show_note: settings.show_note ?? true,
  };
}; 