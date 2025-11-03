import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Get admin client with service role for privileged operations
 */
function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Insert a new comment
 */
export async function insertComment({ userId, pagePath, commentText, userEmail = null, userName = null }) {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        page_path: pagePath,
        comment_text: commentText,
        user_email: userEmail,
        user_name: userName,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in insertComment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all comments with optional filters
 */
export async function getAllComments({ isRead = null, pagePath = null, limit = 100, offset = 0 } = {}) {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase.rpc('get_all_comments_with_details');

    if (error) {
      console.error('Error getting all comments:', error);
      return { success: false, error: error.message };
    }

    // Apply filters
    let filteredData = data || [];

    if (isRead !== null) {
      filteredData = filteredData.filter(comment => comment.is_read === isRead);
    }

    if (pagePath) {
      filteredData = filteredData.filter(comment =>
        comment.page_path.toLowerCase().includes(pagePath.toLowerCase())
      );
    }

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedData,
      total: filteredData.length
    };
  } catch (error) {
    console.error('Error in getAllComments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get comments for a specific page
 */
export async function getPageComments(pagePath, limit = 10) {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('page_path', pagePath)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting page comments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getPageComments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get comments by user ID
 */
export async function getUserComments(userId) {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user comments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getUserComments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update comment read status
 */
export async function updateCommentReadStatus(commentId, isRead) {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ is_read: isRead, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment read status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCommentReadStatus:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId) {
  const supabase = getAdminClient();

  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get unread comment count
 */
export async function getUnreadCommentCount() {
  const supabase = getAdminClient();

  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread comment count:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error in getUnreadCommentCount:', error);
    return { success: false, error: error.message };
  }
}
